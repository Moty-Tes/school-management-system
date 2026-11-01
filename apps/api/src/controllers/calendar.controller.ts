import { Request, Response, NextFunction } from 'express';
import * as calendarService from '../services/calendar.service.js';
import { EthiopianCalendarService } from '../services/ethiopian-calendar.service.js';

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await calendarService.createEvent(req.auth.tenantId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year = Number(req.query.year) || new Date().getFullYear();
    const result = await calendarService.listEvents(req.auth.tenantId, month, year);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function deleteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    await calendarService.deleteEvent(req.auth.tenantId, req.params.id);
    res.status(200).json({ success: true, message: 'Event deleted' });
  } catch (err) { next(err); }
}

export async function getEthiopianTodayHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const ethiopianToday = EthiopianCalendarService.gregorianToEthiopic(new Date());
    res.status(200).json({
      success: true,
      data: ethiopianToday,
    });
  } catch (err) { next(err); }
}

export async function convertEthiopianCalendarHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { date, year, month, day } = req.query;

    if (date) {
      const gDate = new Date(String(date));
      const ethiopianDate = EthiopianCalendarService.gregorianToEthiopic(gDate);
      return res.status(200).json({
        success: true,
        data: {
          gregorian: gDate.toISOString(),
          ethiopian: ethiopianDate,
        },
      });
    }

    if (year && month && day) {
      const gDate = EthiopianCalendarService.ethiopicToGregorian(
        Number(year),
        Number(month),
        Number(day)
      );
      const ethiopianDate = EthiopianCalendarService.gregorianToEthiopic(gDate);
      return res.status(200).json({
        success: true,
        data: {
          gregorian: gDate.toISOString(),
          ethiopian: ethiopianDate,
        },
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Provide either ?date=YYYY-MM-DD or ?year=YYYY&month=M&day=D',
    });
  } catch (err) { next(err); }
}
