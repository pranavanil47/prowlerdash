#!/bin/bash

# Generate SSL certificates for development
# For production, replace with real SSL certificates from Let's Encrypt or your CA

mkdir -p /etc/nginx/certs

# Generate private key
openssl genrsa -out /etc/nginx/certs/key.pem 2048

# Generate certificate signing request
openssl req -new -key /etc/nginx/certs/key.pem -out /etc/nginx/certs/cert.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate self-signed certificate (valid for 365 days)
openssl x509 -req -in /etc/nginx/certs/cert.csr -signkey /etc/nginx/certs/key.pem -out /etc/nginx/certs/cert.pem -days 365

# Clean up CSR file
rm /etc/nginx/certs/cert.csr

echo "✅ SSL certificates generated successfully!"
echo "⚠️  Note: These are self-signed certificates for development only."
echo "   For production, use real SSL certificates from Let's Encrypt or your CA."