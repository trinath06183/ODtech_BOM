# +++++++++++ DJANGO +++++++++++
# To use your own Django app use code like this:
import os
import sys

# assuming your Django settings file is at '/home/myusername/myproject/config/settings.py'
# and your manage.py is is at '/home/myusername/myproject/manage.py'
path = '/home/YOUR_PYTHONANYWHERE_USERNAME/YOUR_PROJECT_FOLDER'
if path not in sys.path:
    sys.path.insert(0, path)

# Set the settings module correctly for your project
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'

# Load environment variables from .env file
from dotenv import load_dotenv
project_folder = os.path.expanduser('~/YOUR_PROJECT_FOLDER')  # adjust as appropriate
load_dotenv(os.path.join(project_folder, '.env'))

# Serve the Django application
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
