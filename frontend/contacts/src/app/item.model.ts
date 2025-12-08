export interface Item {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  mobile?: string;
  event_notification?: 'all' | 'selected' | 'none';
  event_notification_groups?: EventNotificationGroup[];
  selected_groups?: Array<{ id: string; name: string }>;
  eventTypesArray?: string[];
  event_types?: EventType[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EventNotificationGroup {
  id?: number;
  group_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface EventType {
  id?: number;
  event_name: string;
  created_at?: string;
  updated_at?: string;
}
