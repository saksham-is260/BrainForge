import os
import sys
import json
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# Load local .env
load_dotenv()

# Add /api path to Python path for relative imports
sys.path.insert(0, os.path.dirname(__file__))

# Import tera main app (with all routes, instances: ocr_engine, db_manager, ai_processor)
from app import app  # This imports your full app.py (Flask instance + globals)

# Vercel env config (overrides local)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default-fallback-secret')
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 62914560))
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# CORS from env (extend tera app.py ka)
cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000,https://brain-yourusername.vercel.app').split(',')
CORS(app, origins=cors_origins)

# Setup globals per request (serverless – but tera app.py me already init, so minimal)
def setup_globals():
    os.environ['GEMINI_API_KEY'] = os.getenv('GEMINI_API_KEY')
    os.environ['MONGODB_URI'] = os.getenv('MONGODB_URI')
    # No need for model init – tera gemini_processor.py already handles in class

# Vercel Handler (wraps your app routes for serverless – /api/... paths pass through)
def handler(request):
    setup_globals()
    
    with app.test_request_context(
        path=request.path,
        method=request.method,
        headers=dict([(k, v) for k, v in request.headers if k.lower() != 'host']),
        body=request.body or None,
        query_string=request.query_string
    ):
        try:
            # Dispatch to your routes (e.g., /api/health, /api/upload from app.py)
            response = app.full_dispatch_request()
            
            # Vercel format
            body = response.get_data(as_text=True) if 'text/html' in response.mimetype else response.get_json()
            return {
                'statusCode': response.status_code,
                'body': json.dumps(body) if isinstance(body, dict) else body,
                'headers': dict(response.headers)
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': str(e), 'message': 'Internal server error'}),
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
            }

# Local run (same as app.py, but for testing index.py)
if __name__ == '__main__':
    app.run(
        debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true',
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000))
    )