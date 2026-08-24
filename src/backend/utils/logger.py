"""
Logger setup for Flask application
"""
import logging
import logging.handlers
from pathlib import Path
from config import LOG_LEVEL, LOG_FILE

def setup_logger(name):
    """Setup logger for the application"""
    logger = logging.getLogger(name)
    logger.setLevel(LOG_LEVEL)
    
    # Create logs directory if it doesn't exist
    log_dir = Path(LOG_FILE).parent
    log_dir.mkdir(parents=True, exist_ok=True)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(LOG_LEVEL)
    console_format = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(console_format)
    
    # File handler
    try:
        file_handler = logging.handlers.RotatingFileHandler(
            LOG_FILE, maxBytes=10485760, backupCount=10
        )
        file_handler.setLevel(LOG_LEVEL)
        file_handler.setFormatter(console_format)
        logger.addHandler(file_handler)
    except Exception as e:
        print(f"Warning: Could not setup file logging: {e}")
    
    logger.addHandler(console_handler)
    return logger
