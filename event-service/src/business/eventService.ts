import { EventStatus } from "@prisma/client";
import { prisma } from "../data/prismaClient";
import { AppError } from "./config/appError";
import { publishNotification } from "./publisher/notificationPublisher";
import { logger } from "./utils/logger";
import { CreateEventDto } from "./types/createEventDto";
import { UpdateEventDto } from "./types/updateEventDto";

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://auth-service:3000";

const getAuthUser = async (userId: string) => {
  const authResponse = await fetch(
    `${AUTH_SERVICE_URL}/api/auth/internal/${userId}`,
    {
      headers: { "internal-api-key": process.env.INTERNAL_API_KEY || "" },
    },
  );

  const result = await authResponse.json();
  return result.data;
};

export const createEvent = async (
  dto: CreateEventDto,
  createdByUserId: string,
  token: string,
) => {
  const title = dto.title.trim();
  const description = dto.description?.trim();
  const location = dto.location.trim();

  if (
    !title ||
    !location ||
    !dto.date ||
    dto.maxCapacity === undefined ||
    dto.price === undefined
  ) {
    throw new AppError(
      "Tous les champs ormis la description sont obligatoire.",
      400,
    );
  }

  if (dto.maxCapacity <= 0) {
    throw new AppError("La capacité doit être supérieure à 0.", 400);
  }

  if (dto.price <= 0) {
    throw new AppError("Le prix doit être supérieur à 0.", 400);
  }

  const newEvent = await prisma.event.create({
    data: {
      title,
      description,
      location,
      date: dto.date,
      maxCapacity: dto.maxCapacity,
      availableStock: dto.maxCapacity,
      price: dto.price,
      createdByUserId,
    },
  });

  const authUser = await getAuthUser(createdByUserId);

  try {
    await publishNotification({
      template: "EVENT_CREATED",
      to: authUser.email,
      data: { title },
    });
  } catch (error) {
    await logger.warn(
      `Failed to publish EVENT_CREATED notification for ${authUser.email}`,
      { userId: createdByUserId },
    );
  }

  await logger.info(`Event created successfully: ${newEvent.id}`, {
    userId: createdByUserId,
  });

  return newEvent;
};

export const getAllEventsForUser = async (availableOnly: boolean = false) => {
  const events = await prisma.event.findMany({
    where: {
      deletedAt: null,
      status: availableOnly
        ? EventStatus.PUBLISHED
        : { in: [EventStatus.PUBLISHED, EventStatus.SOLD_OUT] },
    },
    orderBy: { date: "asc" },
  });

  await logger.info(
    `Events retrieved successfully for users: ${events.length}`,
  );

  return events;
};

export const getAllEventsForAdmin = async (status?: EventStatus) => {
  const events = await prisma.event.findMany({
    where: {
      ...(status && { status }),
    },
    orderBy: { date: "asc" },
  });

  await logger.info(
    `Events retrieved successfully for admin: ${events.length}`,
  );

  return events;
};

export const getEventsForEventCreator = async (
  userId: string,
  status?: EventStatus,
) => {
  const events = await prisma.event.findMany({
    where: {
      createdByUserId: userId,
      ...(status && { status }),
    },
    orderBy: { date: "asc" },
  });

  await logger.info(`Creator events retrieved successfully: ${events.length}`, {
    userId,
  });

  return events;
};

export const getEventByIdForUser = async (id: string) => {
  const event = await prisma.event.findUnique({
    where: {
      id,
      deletedAt: null,
      status: { in: [EventStatus.PUBLISHED, EventStatus.SOLD_OUT] },
    },
  });

  if (!event) {
    throw new AppError("Événement non trouvé.", 404);
  }

  await logger.info(`Event retrieved successfully for user: ${id}`);

  return event;
};

export const getEventByIdForAdmin = async (id: string) => {
  const event = await prisma.event.findUnique({
    where: {
      id,
    },
  });

  if (!event) {
    throw new AppError("Événement non trouvé.", 404);
  }

  await logger.info(`Event retrieved successfully for admin: ${id}`);

  return event;
};

export const getEventByIdForEventCreator = async (
  id: string,
  userId: string,
) => {
  const event = await prisma.event.findUnique({
    where: {
      id,
      createdByUserId: userId,
    },
  });

  if (!event) {
    throw new AppError("Événement non trouvé.", 404);
  }

  await logger.info(`Creator event retrieved successfully: ${id}`, {
    userId,
  });

  return event;
};

export const updateEvent = async (
  id: string,
  dto: UpdateEventDto,
  userId: string,
  userRole: string,
  token: string,
) => {
  const event = await prisma.event.findUnique({
    where: { id },
  });

  if (!event || event.deletedAt) {
    throw new AppError("Événement non trouvé.", 404);
  }

  if (userRole !== "ADMIN" && event.createdByUserId !== userId) {
    throw new AppError(
      "Vous n'êtes pas autorisé à modifier cet événement.",
      403,
    );
  }

  const updatedEvent = await prisma.event.update({
    where: { id },
    data: {
      title: dto.title,
      description: dto.description,
      location: dto.location,
      date: dto.date,
      maxCapacity: dto.maxCapacity,
      price: dto.price,
    },
  });

  const authUser = await getAuthUser(event.createdByUserId);

  try {
    await publishNotification({
      template: "EVENT_UPDATED",
      to: authUser.email,
      data: { title: updatedEvent.title },
    });
  } catch (error) {
    await logger.warn(
      `Failed to publish EVENT_UPDATED notification for ${authUser.email}`,
      { userId: event.createdByUserId },
    );
  }

  await logger.info(`Event updated successfully: ${id}`, {
    userId,
  });

  return updatedEvent;
};

export const updateEventStatus = async (
  id: string,
  status: EventStatus,
  userId: string,
  userRole: string,
  token: string,
) => {
  const event = await prisma.event.findUnique({
    where: { id },
  });

  if (!event || event.deletedAt) {
    throw new AppError("Événement non trouvé.", 404);
  }

  if (userRole !== "ADMIN" && event.createdByUserId !== userId) {
    throw new AppError(
      "Vous n'êtes pas autorisé à modifier cet événement.",
      403,
    );
  }

  const updatedStatus = await prisma.event.update({
    where: { id },
    data: { status },
  });

  const authUser = await getAuthUser(event.createdByUserId);

  try {
    await publishNotification({
      template: "EVENT_STATUS_UPDATED",
      to: authUser.email,
      data: {
        title: event.title,
        status,
      },
    });
  } catch (error) {
    await logger.warn(
      `Failed to publish EVENT_STATUS_UPDATED notification for ${authUser.email}`,
      { userId: event.createdByUserId },
    );
  }

  await logger.info(`Event status updated successfully: ${id}`, {
    userId,
  });

  return updatedStatus;
};

export const deleteEvent = async (
  id: string,
  userId: string,
  userRole: string,
  token: string,
) => {
  const event = await prisma.event.findUnique({
    where: { id },
  });

  if (!event) {
    throw new AppError("Événement non trouvé.", 404);
  }

  if (event.deletedAt) {
    throw new AppError("Cet événement a déjà été supprimé.", 409);
  }

  if (userRole !== "ADMIN" && event.createdByUserId !== userId) {
    throw new AppError(
      "Vous n'êtes pas autorisé à supprimer cet événement.",
      403,
    );
  }

  await prisma.event.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: EventStatus.CANCELLED,
    },
  });

  const authUser = await getAuthUser(event.createdByUserId);

  try {
    await publishNotification({
      template: "EVENT_DELETED",
      to: authUser.email,
      data: {
        title: event.title,
        data: { title: event.title },
      },
    });
  } catch (error) {
    await logger.warn(
      `Failed to publish EVENT_DELETED notification for ${authUser.email}`,
      { userId: event.createdByUserId },
    );
  }

  await logger.info(`Event deleted successfully: ${id}`, {
    userId,
  });
};

export const decrementStock = async (id: string) => {
  const event = await prisma.event.findUnique({
    where: { id },
  });

  if (!event || event.deletedAt) {
    throw new AppError("Événement non trouvé.", 404);
  }

  if (event.availableStock <= 0) {
    throw new AppError("Aucune place disponible.", 409);
  }

  const updatedEvent = await prisma.event.update({
    where: {
      id,
      availableStock: { gt: 0 },
    },
    data: {
      availableStock: { decrement: 1 },
      status: event.availableStock === 1 ? EventStatus.SOLD_OUT : undefined,
    },
  });

  await logger.info(`Event stock decremented successfully: ${id}`);

  return updatedEvent;
};
