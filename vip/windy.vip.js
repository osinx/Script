let response = JSON.parse($response.body);

response = {
  userInfo: {
    email: 'admin@example.com',
    id: 9368422,
    username: 'jsjiami_user',
    userslug: 'jsjiami_user_slug'
  },
  message: 'ok',
  subscriptionInfo: {
    status: 'active',
    isTrial: false,
    platform: 'ios',
    tier: 'premium',
    expiresAt: 0x444ab384d68,
    state: 'ok',
    isSubscription: true
  },
  subscription: 'premium',
  auth: false,
  token: ''
};

$done({ body: JSON.stringify(response) });

