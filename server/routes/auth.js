import express from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';

const router = express.Router();

/**
 * Clerk webhook handler
 * Syncs user data from Clerk to MongoDB
 */
router.post('/webhook', async (req, res) => {
  const eventType = req.headers['svix-id'];
  
  if (!eventType) {
    return res.status(400).json({ error: 'Missing svix-id header' });
  }
  
  try {
    // Verify webhook signature
    const payload = JSON.stringify(req.body);
    const headers = req.headers;
    
    const evt = await clerkClient.webhooks.verify(payload, headers);
    
    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      // Handle user sync (this would be implemented in a user service)
      console.log('User synced:', evt.data.id);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook verification failed' });
  }
});

export default router;
