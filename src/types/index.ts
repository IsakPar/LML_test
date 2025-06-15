import { Venue, Layout, Show } from '@prisma/client';

export type VenueWithRelations = Venue & {
  layouts: Layout[];
  shows: Show[];
}; 