from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views

from django.contrib.auth import logout
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def custom_logout(request):
    logout(request)
    return redirect('login')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/login/', auth_views.LoginView.as_view(), name='login'),
    path('accounts/logout/', custom_logout, name='logout'),
    path('', include('tracker.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
