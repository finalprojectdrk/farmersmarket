
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from twilio.rest import Client
import json

@csrf_exempt
def send_sms(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        phone = data.get('phone')
        message = data.get('message')

        account_sid = 'ACcc67b43bcaf1a053f054add631a5531e'
        auth_token = '5f568db4f47a3a020bb45b30893dcd90'
        from_number = '+15674303560'

        client = Client(account_sid, auth_token)
        client.messages.create(body=message, from_=from_number, to=phone)

        return JsonResponse({'status': 'success'})

