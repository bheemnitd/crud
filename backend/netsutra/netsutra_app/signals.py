from django.db.models.signals import post_migrate, post_syncdb
from django.dispatch import receiver
from django.apps import apps
from django.core.management import call_command
from django.db import connection

def create_default_data():
    """Function to create default data"""
    from netsutra_app.models import EventType, EventNotificationGroup
    
    # Default Event Types - Must match frontend EVENT_CODE_MAP
    default_event_types = [
        {'id': 1, 'name': '911'},
        {'id': 2, 'name': 'Safewalk'},
        {'id': 3, 'name': 'Sos'},
        {'id': 4, 'name': 'Timer'}
    ]

    # Default Notification Groups - Must match frontend NOTIFICATION_GROUP_MAP
    default_groups = [
        {'id': 1, 'name': 'admin'},
        {'id': 2, 'name': 'security'},
        {'id': 3, 'name': 'hr'},
        {'id': 4, 'name': 'it-support'},
        {'id': 5, 'name': 'management'},
        {'id': 6, 'name': 'incident-response'}
    ]

    # Create default event types
    for event_type in default_event_types:
        EventType.objects.get_or_create(
            id=event_type['id'],
            defaults={'event_name': event_type['name']}
        )

    # Create default notification groups
    for group in default_groups:
        EventNotificationGroup.objects.get_or_create(
            id=group['id'],
            defaults={'group_name': group['name']}
        )

@receiver(post_migrate)
def on_startup(sender, **kwargs):
    """Signal receiver to create default records after migrations and on server start"""
    if sender.label == 'netsutra_app':
        create_default_data()

# Also ensure this runs on server startup
from django.db.backends.signals import connection_created

@receiver(connection_created)
def on_connection_created(sender, **kwargs):
    """Signal receiver to create default records when database connection is first made"""
    from django.apps import apps
    if apps.is_installed('netsutra_app'):
        create_default_data()
