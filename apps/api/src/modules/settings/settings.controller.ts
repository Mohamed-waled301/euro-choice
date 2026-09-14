import { Request, Response, NextFunction } from 'express';
import { getSystemSettings, SystemSettings } from '../../models/SystemSettings';
import { runExpirationSweep } from '../../jobs/expirationJob';
import { SystemSettingsSchema } from '@eurochoice/shared';

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await getSystemSettings();
    return res.status(200).json(settings);
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const data = SystemSettingsSchema.partial().parse(req.body);
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings(data);
    } else {
      Object.assign(settings, data);
    }
    await settings.save();
    return res.status(200).json(settings);
  } catch (error) {
    next(error);
  }
}

export async function triggerExpirationSweep(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await runExpirationSweep();
    return res.status(200).json({
      message: 'Expiration sweep triggered successfully',
      result,
    });
  } catch (error) {
    next(error);
  }
}
