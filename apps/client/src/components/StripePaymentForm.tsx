"use client";

import { loadStripe } from "@stripe/stripe-js";
import { CheckoutProvider } from "@stripe/react-stripe-js";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { CartItemsType, ShippingFormInputs } from "@repo/types";
import useCartStore from "@/stores/cartStore";
import CheckoutForm from "./CheckoutForm";

const stripe = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_KEY!
);

// Con esta función se crea la session con los elementos del carrito 
// y se devuelve la url de redirección de pago.

const fetchClientSecret = async (cart: CartItemsType, token: string) => {
  return fetch(
    `${process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL}/sessions/create-checkout-session`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cart }),
    }
  )
    .then((response) => response.json())
    .then((json) => json.checkoutSessionClientSecret);
};


// Este componente se encarga de mostrar el formulario de pago de Stripe.
// Para ello hace una petición al microservicio payment-service con el token de autenticación

const StripePaymentForm = ({ shippingForm }: { shippingForm: ShippingFormInputs;}) => {
  
  const { cart } = useCartStore();
  const [token, setToken] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    getToken().then((token) => {
      setToken(token);
    }).catch((error) => {
      console.error('❌ Error getting token:', error);
    });
  }, [getToken]);

  if (!token) {
    return <div className="">Loading...</div>;
  }

  return (
    <CheckoutProvider
      stripe={stripe}
      options={{ fetchClientSecret: () => fetchClientSecret(cart, token) }}
    >
      <CheckoutForm shippingForm={shippingForm} />
    </CheckoutProvider>
  );
};

export default StripePaymentForm;