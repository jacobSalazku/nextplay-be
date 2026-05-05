import { registerEnumType } from '@nestjs/graphql';
import {
  ActivityType,
  AttendanceStatus,
  Location,
  PracticeType,
  Role,
  Status,
} from '@prisma/client';

registerEnumType(ActivityType, { name: 'ActivityType' });

registerEnumType(PracticeType, { name: 'PracticeType' });

registerEnumType(Location, { name: 'Location' });

registerEnumType(AttendanceStatus, { name: 'AttendanceStatus' });

registerEnumType(Role, { name: 'Role' });

registerEnumType(Status, { name: 'Status' });
