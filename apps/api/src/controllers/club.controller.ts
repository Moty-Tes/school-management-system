import { Request, Response, NextFunction } from 'express';
import * as clubService from '../services/club.service.js';

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await clubService.createClub(req.auth.tenantId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await clubService.listClubs(req.auth.tenantId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getMembersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await clubService.getClubMembers(req.auth.tenantId, req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function addMemberHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const { studentId, role } = req.body;
    const result = await clubService.addMember(req.auth.tenantId, req.params.id, studentId, role);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function removeMemberHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    await clubService.removeMember(req.auth.tenantId, req.params.membershipId);
    res.status(200).json({ success: true, message: 'Member removed' });
  } catch (err) { next(err); }
}

export async function getStudentClubsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await clubService.getStudentClubs(req.auth.tenantId, req.params.studentId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}