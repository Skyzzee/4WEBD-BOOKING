import { Request, Response, NextFunction } from "express";
import * as paymentService from "../../business/paymentService";

export const createPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { ticketId, userId, amountInCents, paymentMethodId, currency } =
      req.body;
    const result = await paymentService.createPayment(
      ticketId,
      userId,
      amountInCents,
      currency,
    );
    res.status(201).json({
      message: "Paiement traité.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await paymentService.getPaymentById(req.params.id as string);
    res.status(200).json({
      message: "Paiement récupéré avec succès.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentByTicketId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await paymentService.getPaymentByTicketId(
      req.params.ticketId as string,
      res.locals.user.userId,
      res.locals.user.role,
    );
    res.status(200).json({
      message: "Paiement récupéré avec succès.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentsByUserId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await paymentService.getPaymentsByUserId(
      req.params.userId as string,
    );
    res.status(200).json({
      message: "Paiements récupérés avec succès.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentsByEventId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await paymentService.getPaymentsByEventId(
      req.params.eventId as string,
    );
    res.status(200).json({
      message: "Paiements récupérés avec succès.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const refundPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await paymentService.refundPayment(req.params.id as string);
    res.status(200).json({
      message: "Remboursement effectué avec succès.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
