from rest_framework import serializers
from .models import Contact, EventNotificationGroup, EventType

class EventNotificationGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventNotificationGroup
        fields = ['id', 'group_name', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class EventNotificationGroupPartialSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventNotificationGroup
        fields = ['group_name']
        read_only_fields = ['created_at', 'updated_at']

class EventTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventType
        fields = ['id', 'event_name', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class EventTypePartialSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventType
        fields = ['event_name']
        read_only_fields = ['created_at', 'updated_at']

class ContactSerializer(serializers.ModelSerializer):
    # Readable nested data (GET)
    event_notification_groups = EventNotificationGroupPartialSerializer(many=True, read_only=True)
    event_types = EventTypePartialSerializer(many=True, read_only=True)

    # Writable fields using IDs (POST/PUT/PATCH)
    event_notification_groups_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=EventNotificationGroup.objects.all(),
        source='event_notification_groups',
        write_only=True,
        required=False,
    )
    event_types_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=EventType.objects.all(),
        source='event_types',
        write_only=True,
        required=False,
    )

    class Meta:
        model = Contact
        fields = [
            'id', 'first_name', 'last_name', 'email', 'mobile',
            'event_notification_groups', 'event_notification_groups_ids',
            'event_types', 'event_types_ids',
            'is_active', # 'created_at', 'updated_at'
        ]
        #read_only_fields = ['created_at', 'updated_at']
