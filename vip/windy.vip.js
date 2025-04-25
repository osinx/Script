let response = JSON.parse($response.body);

response.subscriptionInfo = {
  status: 'active',
  isTrial: false,
  platform: 'ios',
  tier: 'premium',
  expiresAt: 0x444ab384d68,
  state: 'ok',
  isSubscription: true
};

response.subscription = 'premium';
response.auth = true;

$done({ body: JSON.stringify(response) });

