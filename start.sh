#!/bin/sh

stripe listen --forward-to localhost:3001/api/v1/payments/webhook --api-key whsec_5456e5fe150edfbca8dc6c96e7a686e71bc1a06ce3feb41651e8fcf598ed3eb0 &

node dist/main.js
