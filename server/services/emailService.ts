import nodemailer from "nodemailer";

interface OrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  shippingAddress?: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface EmailService {
  sendOrderConfirmation: (orderData: OrderEmailData) => Promise<void>;
  sendOrderShipped: (
    orderData: OrderEmailData,
    trackingNumber?: string,
  ) => Promise<void>;
  sendOrderDelivered: (orderData: OrderEmailData) => Promise<void>;
}

class NodemailerEmailService implements EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail", // You can change this to your preferred email service
      auth: {
        user: process.env.NODE_MAILER_EMAIL || "noreply@bathroomhardware.com",
        pass: process.env.NODE_MAILER_PASS || "your-app-password",
      },
    });
  }

  private formatPrice(price: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  }

  private generateOrderEmailTemplate(
    orderData: OrderEmailData,
    type: "confirmation" | "shipped" | "delivered",
    trackingNumber?: string,
  ): { subject: string; html: string } {
    const { orderId, customerName, items, totalAmount, shippingAddress } =
      orderData;

    let subject = "";
    let statusMessage = "";
    let additionalInfo = "";

    switch (type) {
      case "confirmation":
        subject = `Order Confirmation - #${orderId}`;
        statusMessage =
          "Thank you for your order! We've received your payment and will begin processing your order shortly.";
        additionalInfo = `
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0;">What happens next?</h3>
            <ul style="color: #6c757d; line-height: 1.6;">
              <li>We'll process your order within 1-2 business days</li>
              <li>You'll receive a shipping notification with tracking information</li>
              <li>Your order will arrive within 3-5 business days</li>
            </ul>
          </div>
        `;
        break;
      case "shipped":
        subject = `Order Shipped - #${orderId}`;
        statusMessage =
          "Great news! Your order has been shipped and is on its way to you.";
        additionalInfo = trackingNumber
          ? `
          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #0056b3; margin-top: 0;">Tracking Information</h3>
            <p style="color: #495057; font-size: 16px; margin: 0;">
              <strong>Tracking Number:</strong> ${trackingNumber}
            </p>
            <p style="color: #6c757d; margin: 10px 0 0 0;">
              You can track your package using this number on our shipping partner's website.
            </p>
          </div>
          `
          : "";
        break;
      case "delivered":
        subject = `Order Delivered - #${orderId}`;
        statusMessage =
          "Your order has been successfully delivered! We hope you love your new bathroom hardware.";
        additionalInfo = `
          <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #155724; margin-top: 0;">How was your experience?</h3>
            <p style="color: #495057; margin: 0;">
              We'd love to hear about your experience! Please consider leaving a review for the products you purchased.
            </p>
          </div>
        `;
        break;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
          <!-- Header -->
          <div style="text-align: center; border-bottom: 2px solid #e9ecef; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #495057; margin: 0; font-size: 28px;">Kiti Store</h1>
            <p style="color: #6c757d; margin: 5px 0 0 0;">Premium Bathroom Hardware & Accessories</p>
          </div>

          <!-- Greeting -->
          <h2 style="color: #495057; margin-bottom: 20px;">Hello ${customerName},</h2>
          
          <!-- Status Message -->
          <p style="font-size: 16px; color: #495057; margin-bottom: 25px;">${statusMessage}</p>

          <!-- Order Details -->
          <div style="background-color: white; padding: 20px; border-radius: 5px; border: 1px solid #dee2e6;">
            <h3 style="color: #495057; margin-top: 0; border-bottom: 1px solid #e9ecef; padding-bottom: 10px;">
              Order Details - #${orderId}
            </h3>
            
            <!-- Items -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 10px; text-align: left; border-bottom: 1px solid #dee2e6;">Item</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 1px solid #dee2e6;">Qty</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 1px solid #dee2e6;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${items
                  .map(
                    (item) => `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f1f3f4;">${item.name}</td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #f1f3f4;">${item.quantity}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #f1f3f4;">${this.formatPrice(item.price * item.quantity)}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
              <tfoot>
                <tr style="background-color: #f8f9fa;">
                  <td colspan="2" style="padding: 15px; font-weight: bold; border-top: 2px solid #dee2e6;">Total:</td>
                  <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px; color: #28a745; border-top: 2px solid #dee2e6;">
                    ${this.formatPrice(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>

            <!-- Shipping Address -->
            ${
              shippingAddress
                ? `
            <div style="margin-top: 20px;">
              <h4 style="color: #495057; margin-bottom: 10px;">Shipping Address:</h4>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
                <p style="margin: 0; line-height: 1.4;">
                  ${shippingAddress.firstName} ${shippingAddress.lastName}<br>
                  ${shippingAddress.address}<br>
                  ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}<br>
                  ${shippingAddress.country}
                </p>
              </div>
            </div>
            `
                : ""
            }
          </div>

          ${additionalInfo}

          <!-- Footer -->
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; margin: 0; font-size: 14px;">
              Questions about your order? Contact us at 
              <a href="mailto:support@bathroomhardware.com" style="color: #007bff;">support@bathroomhardware.com</a>
            </p>
            <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 12px;">
              Kiti Store | Premium Bathroom Hardware & Accessories<br>
              © 2024 Kiti Store. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  }

  async sendOrderConfirmation(orderData: OrderEmailData): Promise<void> {
    try {
      const { subject, html } = this.generateOrderEmailTemplate(
        orderData,
        "confirmation",
      );

      await this.transporter.sendMail({
        from: `"Kiti Store" <${process.env.NODE_MAILER_EMAIL || "noreply@bathroomhardware.com"}>`,
        to: orderData.customerEmail,
        subject,
        html,
      });

      console.log(
        `Order confirmation email sent to ${orderData.customerEmail} for order ${orderData.orderId}`,
      );
    } catch (error) {
      console.error("Failed to send order confirmation email:", error);
      // Don't throw error to avoid blocking the order process
    }
  }

  async sendOrderShipped(
    orderData: OrderEmailData,
    trackingNumber?: string,
  ): Promise<void> {
    try {
      const { subject, html } = this.generateOrderEmailTemplate(
        orderData,
        "shipped",
        trackingNumber,
      );

      await this.transporter.sendMail({
        from: `"Kiti Store" <${process.env.NODE_MAILER_EMAIL || "noreply@bathroomhardware.com"}>`,
        to: orderData.customerEmail,
        subject,
        html,
      });

      console.log(
        `Order shipped email sent to ${orderData.customerEmail} for order ${orderData.orderId}`,
      );
    } catch (error) {
      console.error("Failed to send order shipped email:", error);
    }
  }

  async sendOrderDelivered(orderData: OrderEmailData): Promise<void> {
    try {
      const { subject, html } = this.generateOrderEmailTemplate(
        orderData,
        "delivered",
      );

      await this.transporter.sendMail({
        from: `"Kiti Store" <${process.env.NODE_MAILER_EMAIL || "noreply@bathroomhardware.com"}>`,
        to: orderData.customerEmail,
        subject,
        html,
      });

      console.log(
        `Order delivered email sent to ${orderData.customerEmail} for order ${orderData.orderId}`,
      );
    } catch (error) {
      console.error("Failed to send order delivered email:", error);
    }
  }
}

// Mock email service for development/testing
class MockEmailService implements EmailService {
  async sendOrderConfirmation(orderData: OrderEmailData): Promise<void> {
    console.log(
      `[MOCK EMAIL] Order confirmation sent to ${orderData.customerEmail} for order ${orderData.orderId}`,
    );
    console.log("Order data:", JSON.stringify(orderData, null, 2));
  }

  async sendOrderShipped(
    orderData: OrderEmailData,
    trackingNumber?: string,
  ): Promise<void> {
    console.log(
      `[MOCK EMAIL] Order shipped notification sent to ${orderData.customerEmail} for order ${orderData.orderId}`,
    );
    if (trackingNumber) {
      console.log(`Tracking number: ${trackingNumber}`);
    }
  }

  async sendOrderDelivered(orderData: OrderEmailData): Promise<void> {
    console.log(
      `[MOCK EMAIL] Order delivered notification sent to ${orderData.customerEmail} for order ${orderData.orderId}`,
    );
  }
}

// Export the service based on environment
const emailService: EmailService =
  process.env.NODE_ENV === "production" &&
  process.env.NODE_MAILER_EMAIL &&
  process.env.NODE_MAILER_PASS
    ? new NodemailerEmailService()
    : new MockEmailService();

export default emailService;
export type { OrderEmailData };
