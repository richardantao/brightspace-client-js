import { BaseResource } from "../core/resource";
import type { PaginatedList } from "../types";
import {
	type D2LPageResponse,
	type PaginatedPageResponse,
	CursorPaginatedList,
} from "../core/paginated-list";
import { buildQueryString } from "../core/utils";

// ---------------------------------------------------------------------------
// Wire types — matched exactly to D2L Calendar API response shapes
// @see https://docs.valence.desire2learn.com/res/calendar.html
// ---------------------------------------------------------------------------

/**
 * REPEAT_T — event recurrence frequency type.
 */
export const RepeatType = {
	None: 1,
	Daily: 2,
	Weekly: 3,
	Monthly: 4,
	Yearly: 5,
} as const;
export type RepeatType = (typeof RepeatType)[keyof typeof RepeatType];

/**
 * VISIBILITY_T — event visibility state.
 * Used in conjunction with HIDDENUNIT_T for time-based ranges.
 */
export const CalendarVisibilityType = {
	Visible: 1,
	/** Hidden until `Range` units before StartDate */
	HiddenUntil: 2,
	/** Hidden starting `Range` units after EndDate */
	HiddenStarting: 3,
	/** Visible only between StartDate and EndDate */
	VisibleBetween: 4,
	Hidden: 5,
} as const;
export type CalendarVisibilityType =
	(typeof CalendarVisibilityType)[keyof typeof CalendarVisibilityType];

/**
 * HIDDENUNIT_T — time unit used with VISIBILITY_T range-based visibility.
 */
export const HiddenUnitType = {
	Days: 1,
	Hours: 2,
	Minutes: 3,
} as const;
export type HiddenUnitType =
	(typeof HiddenUnitType)[keyof typeof HiddenUnitType];

/**
 * EVENTTYPE_T — the role a calendar event plays in a user's schedule.
 */
export const CalendarEventType = {
	Reminder: 1,
	AvailabilityStarts: 2,
	AvailabilityEnds: 3,
	UnlockStarts: 4,
	UnlockEnds: 5,
	DueDate: 6,
} as const;
export type CalendarEventType =
	(typeof CalendarEventType)[keyof typeof CalendarEventType];

/**
 * ASSOCIATION_T — filter for whether events have associated entities.
 */
export const AssociationType = {
	Any: 1,
	AssociatedOnly: 2,
	UnassociatedOnly: 3,
} as const;
export type AssociationType =
	(typeof AssociationType)[keyof typeof AssociationType];

/**
 * ASSOCENTITY_T — known associated entity type strings.
 * The list is dynamic — installed components can add new types.
 */
export type AssociatedEntityType =
	| "D2L.LE.Checklist.ChecklistItem"
	| "D2L.LE.Content.ContentObject.ModuleCO"
	| "D2L.LE.Content.ContentObject.TopicCO"
	| "D2L.LE.Discussions.DiscussionForum"
	| "D2L.LE.Discussions.DiscussionTopic"
	| "D2L.LE.Dropbox.Dropbox"
	| "D2L.LE.Grades.GradeObject"
	| "D2L.LE.Quizzing.Quiz"
	| "D2L.LE.Survey.Survey"
	| (string & Record<never, never>); // allow unknown future types

/**
 * Calendar.AssociatedEntity — entity linked to a calendar event (input).
 * @see https://docs.valence.desire2learn.com/res/calendar.html#Calendar.AssociatedEntity
 */
export interface CalendarAssociatedEntity {
	AssociatedEntityType: AssociatedEntityType;
	/** Can be used as the resource ID in the corresponding API */
	AssociatedEntityId: number;
}

/**
 * Calendar.AssociatedEntityInfo — entity linked to a calendar event (output).
 * Includes a navigable link to the entity.
 * @see https://docs.valence.desire2learn.com/res/calendar.html#Calendar.AssociatedEntityInfo
 */
export interface CalendarAssociatedEntityInfo extends CalendarAssociatedEntity {
	Link: string;
}

/**
 * Calendar.RepeatOnInfo — weekly recurrence day template.
 * @see https://docs.valence.desire2learn.com/res/calendar.html#Calendar.RepeatOnInfo
 */
export interface CalendarRepeatOnInfo {
	Monday: boolean;
	Tuesday: boolean;
	Wednesday: boolean;
	Thursday: boolean;
	Friday: boolean;
	Saturday: boolean;
	Sunday: boolean;
}

/**
 * Calendar.RecurrenceInfo — recurrence configuration for a repeating event.
 * RepeatOnInfo applies only to weekly RepeatType events.
 * @see https://docs.valence.desire2learn.com/res/calendar.html#Calendar.RecurrenceInfo
 */
export interface CalendarRecurrenceInfo {
	RepeatType: RepeatType;
	/** How many units between occurrences (e.g. 2 = every two weeks) */
	RepeatEvery: number;
	/** Only used when RepeatType is Weekly */
	RepeatOnInfo: CalendarRepeatOnInfo;
	RepeatUntilDate: string;
}

/**
 * Calendar.VisibilityInfo — visibility restriction for a calendar event.
 * @see https://docs.valence.desire2learn.com/res/calendar.html#Calendar.VisibilityInfo
 */
export interface CalendarVisibilityInfo {
	Type: CalendarVisibilityType;
	/** Number of HiddenRangeUnitType units for time-based visibility */
	Range: number | null;
	HiddenRangeUnitType: HiddenUnitType | null;
	/** Used by HiddenUntil and VisibleBetween */
	StartDate: string | null;
	/** Used by HiddenStarting and VisibleBetween */
	EndDate: string | null;
}

/**
 * Calendar.PresenterInfo — presenter configured within an event.
 * @see https://docs.valence.desire2learn.com/res/calendar.html#Calendar.PresenterInfo
 */
export interface CalendarPresenterInfo {
	UserId: number;
	Name: string;
	DisplayName: string;
	Role: string;
	DisplayRole: string;
	Duration: number;
	Visible: boolean;
}

/**
 * Calendar.EventData — body for create and update actions.
 * Use StartDateTime/EndDateTime for timed events;
 * use StartDay/EndDay for all-day events (time components stripped by the service).
 * @see https://docs.valence.desire2learn.com/res/calendar.html#Calendar.EventData
 */
export interface CalendarEventData {
	Title: string;
	Description: string;
	StartDateTime: string | null;
	EndDateTime: string | null;
	/** For all-day events. EndDay must be a later day than StartDay. */
	StartDay: string | null;
	EndDay: string | null;
	/** Non-null = group calendar event associated with this group ID */
	GroupId: number | null;
	RecurrenceInfo: CalendarRecurrenceInfo;
	LocationId: number | null;
	LocationName: string;
	AssociatedEntity: CalendarAssociatedEntity;
	VisibilityRestrictions: CalendarVisibilityInfo;
}

/**
 * Calendar.EventDataInfo — returned by retrieve and list actions.
 * @see https://docs.valence.desire2learn.com/res/calendar.html#Calendar.EventDataInfo
 */
export interface CalendarEventDataInfo {
	CalendarEventId: number;
	OrgUnitId: number;
	Title: string;
	Description: string;
	StartDateTime: string | null;
	EndDateTime: string | null;
	IsAllDayEvent: boolean;
	StartDay: string | null;
	EndDay: string | null;
	GroupId: number | null;
	IsRecurring: boolean;
	RecurrenceInfo: CalendarRecurrenceInfo;
	LocationId: number | null;
	LocationName: string;
	OrgUnitName: string;
	OrgUnitCode: string;
	IsAssociatedWithEntity: boolean;
	AssociatedEntity: CalendarAssociatedEntityInfo;
	HasVisibilityRestrictions: boolean;
	VisibilityRestrictions: CalendarVisibilityInfo;
	CalendarEventViewUrl: string;
	Presenters: CalendarPresenterInfo[];
}

/**
 * Calendar.OccurrenceInfo — a single occurrence of a recurring event.
 * CalendarEventId may be null when already embedded in an EventWithOccurrencesInfo.
 * @see https://docs.valence.desire2learn.com/res/calendar.html#Calendar.OccurrenceInfo
 */
export interface CalendarOccurrenceInfo {
	RecurrenceId: number;
	CalendarEventId: number | null;
	StartDateTime: string | null;
	EndDateTime: string | null;
	IsAllDayEvent: boolean;
	StartDay: string | null;
	EndDay: string | null;
}

/**
 * Calendar.EventWithOccurrencesInfo — event with its occurrence list.
 * @see https://docs.valence.desire2learn.com/res/calendar.html#Calendar.EventWithOccurrencesInfo
 */
export interface CalendarEventWithOccurrences {
	EventDataInfo: CalendarEventDataInfo;
	Occurrences: CalendarOccurrenceInfo[];
}

/**
 * Calendar.EventCountInfo — event count for a user in a course.
 * @see https://docs.valence.desire2learn.com/res/calendar.html#Calendar.EventCountInfo
 */
export interface CalendarEventCountInfo {
	OrgUnitId: number;
	UserId: number;
	EventCount: number;
}

export interface ListCalendarEventsParams {
	/** Filter by association state */
	associationType?: AssociationType;
	/** Filter by event type role (e.g. DueDate) */
	eventsType?: CalendarEventType;
	startDateTime?: string;
	endDateTime?: string;
	bookmark?: string;
}

// ---------------------------------------------------------------------------
// Resource
// ---------------------------------------------------------------------------

export class CalendarResource extends BaseResource {
	/**
	 * Retrieve a paged list of calendar events for an org unit.
	 * GET /d2l/api/le/(version)/(orgUnitId)/calendar/events/
	 * @see https://docs.valence.desire2learn.com/res/calendar.html#get--d2l-api-le-(version)-(orgUnitId)-calendar-events-
	 */
	async list(
		orgUnitId: number,
		params: ListCalendarEventsParams = {}
	): Promise<PaginatedList<CalendarEventDataInfo>> {
		const page = await this.fetchEventsPage(orgUnitId, params);
		return new CursorPaginatedList(page.items, page.hasMore, page.next);
	}

	/**
	 * Retrieve a specific calendar event.
	 * GET /d2l/api/le/(version)/(orgUnitId)/calendar/event/(eventId)
	 * @see https://docs.valence.desire2learn.com/res/calendar.html#get--d2l-api-le-(version)-(orgUnitId)-calendar-event-(eventId)
	 */
	async retrieve(
		orgUnitId: number,
		eventId: number
	): Promise<CalendarEventDataInfo> {
		return this.get<CalendarEventDataInfo>(
			"le",
			`${orgUnitId}/calendar/event/${eventId}`
		);
	}

	/**
	 * Retrieve a recurring event with all its occurrences.
	 * GET /d2l/api/le/(version)/(orgUnitId)/calendar/event/(eventId)/occurrences/
	 * @see https://docs.valence.desire2learn.com/res/calendar.html#get--d2l-api-le-(version)-(orgUnitId)-calendar-event-(eventId)-occurrences-
	 */
	async retrieveWithOccurrences(
		orgUnitId: number,
		eventId: number
	): Promise<CalendarEventWithOccurrences> {
		return this.get<CalendarEventWithOccurrences>(
			"le",
			`${orgUnitId}/calendar/event/${eventId}/occurrences/`
		);
	}

	/**
	 * Retrieve the calendar event count for a user in an org unit.
	 * GET /d2l/api/le/(version)/(orgUnitId)/calendar/events/count/
	 * @see https://docs.valence.desire2learn.com/res/calendar.html#get--d2l-api-le-(version)-(orgUnitId)-calendar-events-count-
	 */
	async retrieveCount(orgUnitId: number): Promise<CalendarEventCountInfo> {
		return this.get<CalendarEventCountInfo>(
			"le",
			`${orgUnitId}/calendar/events/count/`
		);
	}

	/**
	 * Create a calendar event in an org unit.
	 * POST /d2l/api/le/(version)/(orgUnitId)/calendar/event/
	 * @see https://docs.valence.desire2learn.com/res/calendar.html#post--d2l-api-le-(version)-(orgUnitId)-calendar-event-
	 */
	async create(
		orgUnitId: number,
		data: CalendarEventData
	): Promise<CalendarEventDataInfo> {
		return this.post<CalendarEventDataInfo>(
			"le",
			`${orgUnitId}/calendar/event/`,
			data
		);
	}

	/**
	 * Update a calendar event.
	 * PUT /d2l/api/le/(version)/(orgUnitId)/calendar/event/(eventId)
	 * @see https://docs.valence.desire2learn.com/res/calendar.html#put--d2l-api-le-(version)-(orgUnitId)-calendar-event-(eventId)
	 */
	async update(
		orgUnitId: number,
		eventId: number,
		data: CalendarEventData
	): Promise<CalendarEventDataInfo> {
		return this.put<CalendarEventDataInfo>(
			"le",
			`${orgUnitId}/calendar/event/${eventId}`,
			data
		);
	}

	/**
	 * Delete a calendar event.
	 * Added with LE API v1.82 (LMS v20.25.1). v1.75–1.81 deprecated; v1.74- obsolete.
	 * DELETE /d2l/api/le/(version)/(orgUnitId)/calendar/event/(eventId)
	 * @see https://docs.valence.desire2learn.com/res/calendar.html#delete--d2l-api-le-(version)-(orgUnitId)-calendar-event-(eventId)
	 */
	async del(orgUnitId: number, eventId: number): Promise<void> {
		return this.delete<void>("le", `${orgUnitId}/calendar/event/${eventId}`);
	}

	/**
	 * Add a presenter to a calendar event.
	 * POST /d2l/api/le/(version)/(orgUnitId)/calendar/event/(eventId)/presenter/(userId)
	 * @see https://docs.valence.desire2learn.com/res/calendar.html#post--d2l-api-le-(version)-(orgUnitId)-calendar-event-(eventId)-presenter-(userId)
	 */
	async addPresenter(
		orgUnitId: number,
		eventId: number,
		userId: number
	): Promise<void> {
		return this.post<void>(
			"le",
			`${orgUnitId}/calendar/event/${eventId}/presenter/${userId}`
		);
	}

	/**
	 * Remove a presenter from a calendar event.
	 * DELETE /d2l/api/le/(version)/(orgUnitId)/calendar/event/(eventId)/presenter/(userId)
	 * @see https://docs.valence.desire2learn.com/res/calendar.html#delete--d2l-api-le-(version)-(orgUnitId)-calendar-event-(eventId)-presenter-(userId)
	 */
	async removePresenter(
		orgUnitId: number,
		eventId: number,
		userId: number
	): Promise<void> {
		return this.delete<void>(
			"le",
			`${orgUnitId}/calendar/event/${eventId}/presenter/${userId}`
		);
	}

	// ---------------------------------------------------------------------------
	// Pagination internals
	// ---------------------------------------------------------------------------

	private async fetchEventsPage(
		orgUnitId: number,
		params: ListCalendarEventsParams
	): Promise<PaginatedPageResponse<CalendarEventDataInfo>> {
		const query = buildQueryString({
			associationType: params.associationType,
			eventsType: params.eventsType,
			startDateTime: params.startDateTime,
			endDateTime: params.endDateTime,
			bookmark: params.bookmark,
		});
		const raw = await this.get<D2LPageResponse<CalendarEventDataInfo>>(
			"le",
			`${orgUnitId}/calendar/events/${query}`
		);
		return {
			items: raw.Objects,
			hasMore: raw.HasMoreItems,
			next:
				raw.HasMoreItems && raw.Bookmark
					? () =>
							this.fetchEventsPage(orgUnitId, {
								...params,
								bookmark: raw.Bookmark,
							})
					: undefined,
		};
	}
}