from django.db import models
from django.core.validators import RegexValidator


class EventNotificationGroup(models.Model):
    group_name = models.CharField(
        max_length=255,
        unique=True, 
        db_index=True,  # Improves lookup performance
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Event Notification Group"
        verbose_name_plural = "Event Notification Groups"
        ordering = ['group_name']

    def __str__(self):
        return self.group_name  # Fixed: was returning non-existent `self.group`


class EventType(models.Model):
    event_name = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Event Type"
        verbose_name_plural = "Event Types"
        ordering = ['event_name']

    def __str__(self):
        return self.event_name


class Contact(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(
        max_length=255,
        unique=True,
        db_index=True,
    )
    mobile = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        validators=[
            RegexValidator(
                regex=r'^\+?1?\d{9,15}$',
                message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
            )
        ]
    )
    event_notification_groups = models.ManyToManyField(
        EventNotificationGroup,
        related_name='contacts',
        blank=True,
    )
    event_types = models.ManyToManyField(
        EventType,
        related_name='contacts',
        blank=True,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Contact"
        verbose_name_plural = "Contacts"
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['last_name', 'first_name']),
            models.Index(fields=['email']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()