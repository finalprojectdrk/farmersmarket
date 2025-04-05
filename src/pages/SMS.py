from twilio.rest import Client
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def send_sms(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        phone = data.get('phone')
        message = data.get('message')

        # Twilio credentials
       account_sid = 'ACcc67b43bcaf1a053f054add631a5531e'
auth_token = '5f568db4f47a3a020bb45b30893dcd90'
    client = Client(account_sid, auth_token)

        client = Client(account_sid, auth_token)

        try:
            client.messages.create(
                body=message,
                from_='+15674303560',
                to=phone
            )
            return JsonResponse({'status': 'success'}, status=200)
            except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
