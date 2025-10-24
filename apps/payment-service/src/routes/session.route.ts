import { Hono } from "hono";

import { shouldBeUser } from "../middleware/authMiddleware";
import { CartItemsType } from "@repo/types";
import { getStripeProductPrice } from "../../utils/stripeProduct";
import stripe from "../../utils/stripe";


const sessionRoute = new Hono();

sessionRoute.post("/create-checkout-session", shouldBeUser, async (c) => {
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "T-shirt",
            },
            unit_amount: 2000,
          },
          quantity: 1,
        },
      ],
    mode: "payment",
      ui_mode: "custom",
        return_url: "http://localhost:3002/return?session_id={CHECKOUT_SESSION_ID}",
    })

    return c.json({ checkoutSessionClientSecret: session.client_secret })
  } catch (error) {
  console.log(error)
  return c.json({ error })
}
})

export default sessionRoute;


