from django.shortcuts import render

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.pagination import LimitOffsetPagination
from django.db.models import Q
from .models import Contact, EventNotificationGroup, EventType
from .serializers import (
    ContactSerializer,
    EventNotificationGroupSerializer,
    EventTypeSerializer
)

class TenPerPagePagination(LimitOffsetPagination):
    default_limit = 10

class ContactViewSet(viewsets.ModelViewSet):

    queryset = Contact.objects.all().order_by('-created_at')
    serializer_class = ContactSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = TenPerPagePagination

    @action(detail=True, methods=['get'])
    def groups(self, request, pk=None):
        contact = self.get_object()
        groups = contact.event_notification_groups.all()
        serializer = EventNotificationGroupSerializer(groups, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def event_types(self, request, pk=None):
        contact = self.get_object()
        event_types = contact.event_types.all()
        serializer = EventTypeSerializer(event_types, many=True)
        return Response(serializer.data)

class EventNotificationGroupViewSet(viewsets.ModelViewSet):

    queryset = EventNotificationGroup.objects.all().order_by('group_name')
    serializer_class = EventNotificationGroupSerializer
    permission_classes = [permissions.AllowAny]


class EventTypeViewSet(viewsets.ModelViewSet):

    queryset = EventType.objects.all().order_by('event_name')
    serializer_class = EventTypeSerializer
    permission_classes = [permissions.AllowAny]

@api_view(['GET'])
def get_filter_data(request):
    queryset = Contact.objects.filter(
        Q(email="test1@gmail.com") | Q(mobile="+1-222222")
    )
    serializer = ContactSerializer(queryset, many=True)
    return Response(serializer.data)