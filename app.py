"""
Victor Terminal - Real-time Stock Data API
Uses yfinance to scrape live stock data from Yahoo Finance
Integrates Google Gemini AI for stock predictions
"""

import os
from flask import Flask, jsonify, request, g
from flask_cors import CORS
import yfinance as yf
from datetime import datetime, timedelta
import threading
import time
import google.generativeai as genai
from functools import wraps

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Load environment variables manually
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

load_env()

# Configure Gemini AI
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY not found in environment variables!")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

# Rate Limiter Implementation
class RateLimiter:
    def __init__(self):
        self.requests = {}
        self.lock = threading.Lock()
    
    def is_allowed(self, ip, limit=10, window=60):
        current_time = time.time()
        with self.lock:
            # Clean old requests
            if ip in self.requests:
                self.requests[ip] = [t for t in self.requests[ip] if current_time - t < window]
            else:
                self.requests[ip] = []
            
            # Check limit
            if len(self.requests[ip]) < limit:
                self.requests[ip].append(current_time)
                return True, len(self.requests[ip]), limit
            
            return False, len(self.requests[ip]), limit

limiter = RateLimiter()

def rate_limit(limit=60, window=60):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            # Get IP address
            ip = request.headers.get('X-Forwarded-For', request.remote_addr)
            
            allowed, current, max_req = limiter.is_allowed(f"{ip}:{f.__name__}", limit, window)
            
            if not allowed:
                return jsonify({
                    'error': 'Too many requests',
                    'message': f'Rate limit exceeded. Try again in a few seconds.',
                    'retry_after': window
                }), 429
            
            return f(*args, **kwargs)
        return wrapped
    return decorator

# Indian stock symbols
STOCK_SYMBOLS = [
    'RELIANCE.NS',
    'TCS.NS',
    'HDFCBANK.NS',
    'INFY.NS',
    'ICICIBANK.NS',
    'SBIN.NS',
    'BHARTIARTL.NS',
    'ITC.NS',
]

# Cache for stock data
stock_cache = {}
cache_lock = threading.Lock()
last_update = None


def format_volume(volume):
    """Format volume to readable string"""
    if volume >= 1e9:
        return f"{volume/1e9:.2f}B"
    if volume >= 1e6:
        return f"{volume/1e6:.2f}M"
    if volume >= 1e3:
        return f"{volume/1e3:.2f}K"
    return str(volume)


def format_market_cap(cap):
    """Format market cap to readable string"""
    if cap >= 1e12:
        return f"{cap/1e12:.1f}T"
    if cap >= 1e9:
        return f"{cap/1e9:.1f}B"
    if cap >= 1e6:
        return f"{cap/1e6:.1f}M"
    return str(cap)


def fetch_stock_data(symbol):
    """Fetch real-time data for a single stock"""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        # Get current price and change
        current_price = info.get('currentPrice') or info.get('regularMarketPrice', 0)
        previous_close = info.get('previousClose') or info.get('regularMarketPreviousClose', 0)
        
        if previous_close and previous_close > 0:
            change_percent = ((current_price - previous_close) / previous_close) * 100
        else:
            change_percent = 0
        
        return {
            'symbol': symbol,
            'name': info.get('shortName') or info.get('longName', symbol),
            'sector': info.get('sector', 'N/A'),
            'price': round(current_price, 2),
            'change': round(change_percent, 2),
            'open': round(info.get('open') or info.get('regularMarketOpen', 0), 2),
            'high': round(info.get('dayHigh') or info.get('regularMarketDayHigh', 0), 2),
            'low': round(info.get('dayLow') or info.get('regularMarketDayLow', 0), 2),
            'previousClose': round(previous_close, 2),
            'volume': format_volume(info.get('volume') or info.get('regularMarketVolume', 0)),
            'pe': round(info.get('trailingPE', 0), 1) if info.get('trailingPE') else 'N/A',
            'marketCap': format_market_cap(info.get('marketCap', 0)),
            'fiftyTwoWeekHigh': round(info.get('fiftyTwoWeekHigh', 0), 2),
            'fiftyTwoWeekLow': round(info.get('fiftyTwoWeekLow', 0), 2),
            'avgVolume': format_volume(info.get('averageVolume', 0)),
        }
    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
        return None


def fetch_historical_data(symbol, period='1mo', interval='1d'):
    """Fetch historical price data for charts"""
    try:
        ticker = yf.Ticker(symbol)
        history = ticker.history(period=period, interval=interval)
        
        data = []
        for date, row in history.iterrows():
            data.append({
                'date': date.strftime('%Y-%m-%d'),
                'open': round(row['Open'], 2),
                'high': round(row['High'], 2),
                'low': round(row['Low'], 2),
                'close': round(row['Close'], 2),
                'volume': int(row['Volume']),
            })
        
        return data
    except Exception as e:
        print(f"Error fetching history for {symbol}: {e}")
        return []


def update_cache():
    """Background task to update stock cache"""
    global stock_cache, last_update
    
    while True:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Updating stock data...")
        
        new_data = {}
        for symbol in STOCK_SYMBOLS:
            data = fetch_stock_data(symbol)
            if data:
                new_data[symbol] = data
        
        with cache_lock:
            stock_cache = new_data
            last_update = datetime.now()
        
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Updated {len(new_data)} stocks")
        
        # Update every 30 seconds
        time.sleep(30)


@app.route('/api/stocks', methods=['GET'])
@rate_limit(limit=60, window=60)
def get_stocks():
    """Get all stock quotes"""
    with cache_lock:
        stocks = list(stock_cache.values())
        update_time = last_update.isoformat() if last_update else None
    
    return jsonify({
        'stocks': stocks,
        'lastUpdate': update_time,
        'count': len(stocks)
    })


@app.route('/api/stocks/<symbol>', methods=['GET'])
@rate_limit(limit=60, window=60)
def get_stock(symbol):
    """Get single stock quote"""
    with cache_lock:
        stock = stock_cache.get(symbol)
    
    if stock:
        return jsonify(stock)
    
    # Fetch fresh if not in cache
    data = fetch_stock_data(symbol)
    if data:
        return jsonify(data)
    
    return jsonify({'error': 'Stock not found'}), 404


@app.route('/api/stocks/<symbol>/history', methods=['GET'])
def get_stock_history(symbol):
    """Get historical data for a stock"""
    from flask import request
    
    period = request.args.get('period', '1mo')
    interval = request.args.get('interval', '1d')
    
    data = fetch_historical_data(symbol, period, interval)
    
    return jsonify({
        'symbol': symbol,
        'period': period,
        'interval': interval,
        'data': data,
        'count': len(data)
    })


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    with cache_lock:
        update_time = last_update.isoformat() if last_update else None
        stock_count = len(stock_cache)
    
    return jsonify({
        'status': 'running',
        'lastUpdate': update_time,
        'stocksInCache': stock_count,
        'serverTime': datetime.now().isoformat()
    })


@app.route('/api/search', methods=['GET'])
@rate_limit(limit=30, window=60)
def search_stocks():
    """Search for stocks on NSE/BSE"""
    from flask import request
    
    query = request.args.get('q', '').upper().strip()
    exchange = request.args.get('exchange', 'NSE').upper()
    
    if not query or len(query) < 2:
        return jsonify({'results': [], 'error': 'Query too short'})
    
    # Common Indian stocks for search
    POPULAR_STOCKS = {
        'RELIANCE': {'name': 'Reliance Industries Ltd', 'sector': 'Energy'},
        'TCS': {'name': 'Tata Consultancy Services', 'sector': 'IT'},
        'HDFCBANK': {'name': 'HDFC Bank Ltd', 'sector': 'Banking'},
        'INFY': {'name': 'Infosys Ltd', 'sector': 'IT'},
        'ICICIBANK': {'name': 'ICICI Bank Ltd', 'sector': 'Banking'},
        'SBIN': {'name': 'State Bank of India', 'sector': 'Banking'},
        'BHARTIARTL': {'name': 'Bharti Airtel Ltd', 'sector': 'Telecom'},
        'ITC': {'name': 'ITC Ltd', 'sector': 'FMCG'},
        'KOTAKBANK': {'name': 'Kotak Mahindra Bank', 'sector': 'Banking'},
        'LT': {'name': 'Larsen & Toubro', 'sector': 'Infrastructure'},
        'HINDUNILVR': {'name': 'Hindustan Unilever', 'sector': 'FMCG'},
        'AXISBANK': {'name': 'Axis Bank Ltd', 'sector': 'Banking'},
        'BAJFINANCE': {'name': 'Bajaj Finance Ltd', 'sector': 'Finance'},
        'MARUTI': {'name': 'Maruti Suzuki India', 'sector': 'Automobile'},
        'TITAN': {'name': 'Titan Company Ltd', 'sector': 'Consumer'},
        'ASIANPAINT': {'name': 'Asian Paints Ltd', 'sector': 'Chemicals'},
        'WIPRO': {'name': 'Wipro Ltd', 'sector': 'IT'},
        'HCLTECH': {'name': 'HCL Technologies', 'sector': 'IT'},
        'SUNPHARMA': {'name': 'Sun Pharmaceutical', 'sector': 'Pharma'},
        'TATAMOTORS': {'name': 'Tata Motors Ltd', 'sector': 'Automobile'},
        'TATASTEEL': {'name': 'Tata Steel Ltd', 'sector': 'Metal'},
        'POWERGRID': {'name': 'Power Grid Corp', 'sector': 'Power'},
        'NTPC': {'name': 'NTPC Ltd', 'sector': 'Power'},
        'ONGC': {'name': 'Oil & Natural Gas Corp', 'sector': 'Energy'},
        'TECHM': {'name': 'Tech Mahindra Ltd', 'sector': 'IT'},
        'ULTRACEMCO': {'name': 'UltraTech Cement', 'sector': 'Cement'},
        'ADANIENT': {'name': 'Adani Enterprises', 'sector': 'Diversified'},
        'ADANIPORTS': {'name': 'Adani Ports & SEZ', 'sector': 'Infrastructure'},
        'JSWSTEEL': {'name': 'JSW Steel Ltd', 'sector': 'Metal'},
        'COALINDIA': {'name': 'Coal India Ltd', 'sector': 'Mining'},
    }
    
    results = []
    suffix = '.NS' if exchange == 'NSE' else '.BO'
    
    for symbol, info in POPULAR_STOCKS.items():
        if query in symbol or query in info['name'].upper():
            results.append({
                'symbol': f"{symbol}{suffix}",
                'name': info['name'],
                'sector': info['sector'],
                'exchange': exchange
            })
    
    # Also try to fetch directly from yfinance if not in our list
    if len(results) == 0:
        try:
            test_symbol = f"{query}{suffix}"
            ticker = yf.Ticker(test_symbol)
            info = ticker.info
            if info.get('regularMarketPrice'):
                results.append({
                    'symbol': test_symbol,
                    'name': info.get('shortName', query),
                    'sector': info.get('sector', 'N/A'),
                    'exchange': exchange
                })
        except:
            pass
    
    return jsonify({
        'query': query,
        'exchange': exchange,
        'results': results[:10],
        'count': len(results[:10])
    })


@app.route('/api/predict', methods=['POST'])
@rate_limit(limit=10, window=60)  # Stricter limit for AI endpoint
def predict_stock():
    """AI-powered stock prediction using Google Gemini"""
    try:
        data = request.get_json()
        symbol = data.get('symbol', '')
        
        if not symbol:
            return jsonify({'error': 'Symbol required'}), 400
        
        # Fetch stock data for context
        stock_data = fetch_stock_data(symbol)
        if not stock_data:
            return jsonify({'error': 'Could not fetch stock data'}), 404
        
        # Fetch historical data
        history = fetch_historical_data(symbol, '1mo', '1d')
        
        # Calculate some technical indicators
        if history and len(history) >= 5:
            recent_prices = [h['close'] for h in history[-10:]]
            avg_price = sum(recent_prices) / len(recent_prices)
            price_trend = "upward" if recent_prices[-1] > recent_prices[0] else "downward"
            volatility = max(recent_prices) - min(recent_prices)
            
            history_summary = f"""
            Recent 10-day prices: {[round(p, 2) for p in recent_prices]}
            Average: ₹{avg_price:.2f}
            Trend: {price_trend}
            Volatility: ₹{volatility:.2f}
            """
        else:
            history_summary = "Limited historical data available"
        
        # Create prompt for Gemini
        prompt = f"""You are a professional stock market analyst. Analyze this Indian stock and provide a prediction.

Stock: {stock_data['name']} ({symbol})
Sector: {stock_data['sector']}
Current Price: ₹{stock_data['price']}
Today's Change: {stock_data['change']}%
Open: ₹{stock_data['open']}
High: ₹{stock_data['high']}
Low: ₹{stock_data['low']}
P/E Ratio: {stock_data['pe']}
Market Cap: {stock_data['marketCap']}
Volume: {stock_data['volume']}

Historical Data (1 month):
{history_summary}

Based on this data, provide a SHORT analysis with:
1. TARGET PRICE (7-day): Give a specific price number
2. CONFIDENCE: A percentage (50-95%)
3. RECOMMENDATION: One of: STRONG BUY, BUY, HOLD, SELL, STRONG SELL
4. BRIEF REASONING: 2-3 sentences max

Format your response EXACTLY like this (with actual values):
TARGET_PRICE: ₹XXXX.XX
CONFIDENCE: XX%
RECOMMENDATION: XXXXX
REASONING: Your brief analysis here.

Important: Be realistic and base predictions on the data provided. Do not give financial advice disclaimers."""

        # Call Gemini API
        response = model.generate_content(prompt)
        ai_response = response.text.strip()
        
        # Parse the response
        lines = ai_response.split('\n')
        result = {
            'symbol': symbol,
            'currentPrice': stock_data['price'],
            'targetPrice': None,
            'confidence': None,
            'recommendation': None,
            'reasoning': None,
            'rawResponse': ai_response
        }
        
        for line in lines:
            line = line.strip()
            if line.startswith('TARGET_PRICE:'):
                try:
                    price_str = line.replace('TARGET_PRICE:', '').strip()
                    price_str = price_str.replace('₹', '').replace(',', '').strip()
                    result['targetPrice'] = float(price_str)
                except:
                    pass
            elif line.startswith('CONFIDENCE:'):
                try:
                    conf_str = line.replace('CONFIDENCE:', '').strip()
                    conf_str = conf_str.replace('%', '').strip()
                    result['confidence'] = int(float(conf_str))
                except:
                    pass
            elif line.startswith('RECOMMENDATION:'):
                result['recommendation'] = line.replace('RECOMMENDATION:', '').strip()
            elif line.startswith('REASONING:'):
                result['reasoning'] = line.replace('REASONING:', '').strip()
        
        # Set defaults if parsing failed
        if result['targetPrice'] is None:
            result['targetPrice'] = stock_data['price'] * (1 + (0.05 if stock_data['change'] > 0 else -0.02))
        if result['confidence'] is None:
            result['confidence'] = 70
        if result['recommendation'] is None:
            result['recommendation'] = 'HOLD'
        if result['reasoning'] is None:
            result['reasoning'] = ai_response[:200] if ai_response else "Analysis based on current market conditions."
        
        result['success'] = True
        result['model'] = 'gemini-1.5-flash'
        result['timestamp'] = datetime.now().isoformat()
        
        return jsonify(result)
        
    except Exception as e:
        print(f"AI Prediction Error: {e}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500



def fetch_market_news():
    """Fetch real-time market news"""
    try:
        # Fetch news from NSE index or major stocks
        ticker = yf.Ticker('^NSEI')
        news = ticker.news
        
        formatted_news = []
        for item in news:
            # Parse timestamp
            try:
                pub_time = datetime.fromtimestamp(item.get('providerPublishTime', 0))
                time_str = pub_time.strftime('%H:%M')
            except:
                time_str = "Recent"
                
            formatted_news.append({
                'title': item.get('title'),
                'link': item.get('link'),
                'publisher': item.get('publisher'),
                'time': time_str,
                'providerPublishTime': item.get('providerPublishTime', 0)
            })
            
        return formatted_news[:10]  # Return top 10 news items
    except Exception as e:
        print(f"Error fetching news: {e}")
        return []


@app.route('/api/news', methods=['GET'])
@rate_limit(limit=20, window=60)
def get_market_news():
    """Get latest market news"""
    news = fetch_market_news()
    return jsonify({
        'news': news,
        'count': len(news),
        'timestamp': datetime.now().isoformat()
    })


if __name__ == '__main__':
    # Start background cache updater
    cache_thread = threading.Thread(target=update_cache, daemon=True)
    cache_thread.start()
    
    # Wait for initial data load
    print("Loading initial stock data...")
    time.sleep(5)
    
    print("\n" + "="*50)
    print("Victor Terminal API Server")
    print("="*50)
    print(f"Server running at: http://localhost:5000")
    print(f"Endpoints:")
    print(f"  GET /api/stocks         - All stock quotes")
    print(f"  GET /api/stocks/<sym>   - Single stock quote")
    print(f"  GET /api/stocks/<sym>/history - Historical data")
    print(f"  GET /api/health         - Server health")
    print("="*50 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=False)
