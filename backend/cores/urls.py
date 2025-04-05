from django.urls import path
from .views import send_sms

urlpatterns = [
    path('src/send-sms/', send_sms),
]
