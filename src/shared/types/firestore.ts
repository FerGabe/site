import type { Timestamp } from "firebase/firestore";

export type PaymentMethod = "pix" | "credit_card";

export type GiftRequestStatus = "pending" | "confirmed" | "canceled";

export type GiftRequestPayload = {
  giftId: string;
  giftName: string;
  giftValue: number;
  guestName: string;
  guestWhatsapp: string;
  message: string;
  paymentMethod: PaymentMethod;
  status: GiftRequestStatus;
  createdAt: Timestamp;
};

export type RsvpPayload = {
  fullName: string;
  attending: boolean;
  adults: number;
  children: number;
  message: string;
  createdAt: Timestamp;
};
