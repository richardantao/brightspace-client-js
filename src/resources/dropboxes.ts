import { BaseResource } from "../core/resource";
import type { PaginatedList } from "../types";
import {
	type D2LPageResponse,
	type PaginatedPageResponse,
	CursorPaginatedList,
} from "../core/paginated-list";
import { buildQueryString } from "../core/utils";

// ---------------------------------------------------------------------------
// Wire types — matched exactly to D2L Dropbox API response shapes
// @see https://docs.valence.desire2learn.com/res/dropbox.html
// ---------------------------------------------------------------------------

/** ENTITYDROPBOXSTATUS_T */
export const DropboxEntityStatus = {
	Unsubmitted: 0,
	Submitted: 1,
	Draft: 2,
	Published: 3,
} as const;
export type DropboxEntityStatus =
	(typeof DropboxEntityStatus)[keyof typeof DropboxEntityStatus];

/** DROPBOXTYPE_T */
export const DropboxType = {
	Group: 1,
	Individual: 2,
} as const;
export type DropboxType = (typeof DropboxType)[keyof typeof DropboxType];

/** SUBMISSIONTYPE_T */
export const SubmissionType = {
	File: 0,
	Text: 1,
	OnPaper: 2,
	Observed: 3,
	FileOrText: 4,
} as const;
export type SubmissionType =
	(typeof SubmissionType)[keyof typeof SubmissionType];

/**
 * DROPBOX_COMPLETIONTYPE_T
 * Supported values depend on SubmissionType:
 *   File/FileOrText/Text → OnSubmission only
 *   OnPaper/Observed → DueDate, ManuallyByLearner, OnEvaluation
 */
export const DropboxCompletionType = {
	OnSubmission: 0,
	DueDate: 1,
	ManuallyByLearner: 2,
	OnEvaluation: 3,
} as const;
export type DropboxCompletionType =
	(typeof DropboxCompletionType)[keyof typeof DropboxCompletionType];

export interface RichText {
	Text: string;
	Html: string | null;
}

export interface RichTextInput {
	Content: string;
	Type: "Text" | "Html";
}

export interface DropboxAttachment {
	FileId: number;
	FileName: string;
	Size: number;
}

export interface DropboxLinkAttachment {
	LinkId: number;
	LinkName: string;
	Href: string;
}

export interface DropboxAssessment {
	ScoreDenominator: number | null;
	/** Array of Rubric blocks. See AssessmentsResource for the Rubric type. */
	Rubrics: unknown[];
}

export interface DropboxAvailability {
	StartDate: string | null;
	EndDate: string | null;
	StartDateAvailabilityType: string | null;
	EndDateAvailabilityType: string | null;
}

/**
 * Dropbox.DropboxFolder — returned by retrieve and list actions.
 * @see https://docs.valence.desire2learn.com/res/dropbox.html#Dropbox.DropboxFolder
 */
export interface DropboxFolder {
	Id: number;
	CategoryId: number | null;
	Name: string;
	CustomInstructions: RichText;
	Attachments: DropboxAttachment[];
	TotalFiles: number;
	UnreadFiles: number;
	FlaggedFiles: number;
	/**
	 * -1 indicates the org unit is too large for performant calculation,
	 * or the calling user lacks permission to access this information.
	 */
	TotalUsers: number;
	TotalUsersWithSubmissions: number;
	TotalUsersWithFeedback: number;
	Availability: DropboxAvailability | null;
	/** Non-null = group submission folder; value is the GroupCategoryId */
	GroupTypeId: number | null;
	DueDate: string | null;
	/** When true, DueDate/EndDate/StartDate (in priority order) appears in calendar */
	DisplayInCalendar: boolean;
	Assessment: DropboxAssessment | null;
	/** Comma-separated email addresses; null = no notification */
	NotificationEmail: string | null;
	IsHidden: boolean;
	LinkAttachments: DropboxLinkAttachment[];
	ActivityId: string | null;
	IsAnonymous: boolean;
	DropboxType: DropboxType;
	SubmissionType: SubmissionType;
	CompletionType: DropboxCompletionType;
	GradeItemId: number | null;
	/** null = calling user lacks permission to manage dropboxes */
	AllowOnlyUsersWithSpecialAccess: boolean | null;
}

/**
 * Dropbox.DropboxFolderUpdateData — body for create and update actions.
 * Omitted or null fields preserve existing values on update.
 * @see https://docs.valence.desire2learn.com/res/dropbox.html#Dropbox.DropboxFolderUpdateData
 */
export interface DropboxFolderUpdateData {
	CategoryId: number | null;
	Name: string;
	CustomInstructions: RichTextInput;
	Availability: DropboxAvailability | null;
	GroupTypeId: number | null;
	DueDate: string | null;
	DisplayInCalendar: boolean;
	NotificationEmail: string | null;
	/** null = preserve current setting */
	IsHidden: boolean | null;
	/** null = no change; ScoreDenominator null = no change */
	Assessment: { ScoreDenominator: number | null } | null;
	/** null = preserve current setting */
	IsAnonymous: boolean | null;
	/** null = preserve current setting */
	DropboxType: DropboxType | null;
	/** null = preserve; cannot change after submissions received */
	SubmissionType: SubmissionType | null;
	/** null = preserve; cannot change after submissions received */
	CompletionType: DropboxCompletionType | null;
	GradeItemId: number | null;
	AllowOnlyUsersWithSpecialAccess: boolean | null;
}

/**
 * Dropbox.DropboxSubmission — a single user submission to a dropbox.
 * @see https://docs.valence.desire2learn.com/res/dropbox.html#Dropbox.DropboxSubmission
 */
export interface DropboxSubmission {
	Id: number;
	SubmittedBy: number;
	SubmissionDate: string;
	/** File blocks submitted with this entry */
	Files: DropboxAttachment[];
	Comment: RichText;
}

/**
 * Dropbox.DropboxEntitySubmission — entity-style submission (group or individual).
 * @see https://docs.valence.desire2learn.com/res/dropbox.html#Dropbox.DropboxEntitySubmission
 */
export interface DropboxEntitySubmission {
	EntityId: number;
	EntityName: string | null;
	Status: DropboxEntityStatus;
	Feedback: DropboxFeedback | null;
	Submissions: DropboxSubmission[];
}

/**
 * Dropbox.DropboxFeedback — assessor feedback on a submission.
 * @see https://docs.valence.desire2learn.com/res/dropbox.html#Dropbox.DropboxFeedback
 */
export interface DropboxFeedback {
	Score: number | null;
	Feedback: RichText;
	RubricAssessments: unknown[];
	IsPublished: boolean;
	FeedbackAttachments: DropboxAttachment[];
}

/**
 * Dropbox.DropboxFolderCategory — a folder category grouping.
 * @see https://docs.valence.desire2learn.com/res/dropbox.html#Dropbox.DropboxFolderCategory
 */
export interface DropboxFolderCategory {
	Id: number;
	Name: string;
	SortOrder: number;
}

export interface DropboxFolderCategoryData {
	Name: string;
	SortOrder: number;
}

export interface ListDropboxFoldersParams {
	bookmark?: string;
}

// ---------------------------------------------------------------------------
// Resource
// ---------------------------------------------------------------------------

export class DropboxesResource extends BaseResource {
	// ---------------------------------------------------------------------------
	// Folders
	// ---------------------------------------------------------------------------

	/**
	 * Retrieve a paged list of dropbox folders for a course.
	 * GET /d2l/api/le/(version)/(orgUnitId)/dropbox/folders/
	 * @see https://docs.valence.desire2learn.com/res/dropbox.html#get--d2l-api-le-(version)-(orgUnitId)-dropbox-folders-
	 */
	async list(
		orgUnitId: number,
		params: ListDropboxFoldersParams = {}
	): Promise<PaginatedList<DropboxFolder>> {
		const page = await this.fetchFoldersPage(orgUnitId, params);
		return new CursorPaginatedList(page.items, page.hasMore, page.next);
	}

	/**
	 * Retrieve a specific dropbox folder.
	 * GET /d2l/api/le/(version)/(orgUnitId)/dropbox/folders/(folderId)
	 * @see https://docs.valence.desire2learn.com/res/dropbox.html#get--d2l-api-le-(version)-(orgUnitId)-dropbox-folders-(folderId)
	 */
	async retrieve(orgUnitId: number, folderId: number): Promise<DropboxFolder> {
		return this.get<DropboxFolder>(
			"le",
			`${orgUnitId}/dropbox/folders/${folderId}`
		);
	}

	/**
	 * Create a dropbox folder.
	 * POST /d2l/api/le/(version)/(orgUnitId)/dropbox/folders/
	 * @see https://docs.valence.desire2learn.com/res/dropbox.html#post--d2l-api-le-(version)-(orgUnitId)-dropbox-folders-
	 */
	async create(
		orgUnitId: number,
		data: DropboxFolderUpdateData
	): Promise<DropboxFolder> {
		return this.post<DropboxFolder>(
			"le",
			`${orgUnitId}/dropbox/folders/`,
			data
		);
	}

	/**
	 * Update a dropbox folder. Omitted or null fields preserve existing values.
	 * PUT /d2l/api/le/(version)/(orgUnitId)/dropbox/folders/(folderId)
	 * @see https://docs.valence.desire2learn.com/res/dropbox.html#put--d2l-api-le-(version)-(orgUnitId)-dropbox-folders-(folderId)
	 */
	async update(
		orgUnitId: number,
		folderId: number,
		data: DropboxFolderUpdateData
	): Promise<DropboxFolder> {
		return this.put<DropboxFolder>(
			"le",
			`${orgUnitId}/dropbox/folders/${folderId}`,
			data
		);
	}

	/**
	 * Delete a dropbox folder.
	 * DELETE /d2l/api/le/(version)/(orgUnitId)/dropbox/folders/(folderId)
	 * @see https://docs.valence.desire2learn.com/res/dropbox.html#delete--d2l-api-le-(version)-(orgUnitId)-dropbox-folders-(folderId)
	 */
	async del(orgUnitId: number, folderId: number): Promise<void> {
		return this.delete<void>("le", `${orgUnitId}/dropbox/folders/${folderId}`);
	}

	// ---------------------------------------------------------------------------
	// Submissions
	// ---------------------------------------------------------------------------

	/**
	 * Retrieve all entity submissions for a dropbox folder.
	 * GET /d2l/api/le/(version)/(orgUnitId)/dropbox/folders/(folderId)/submissions/
	 * @see https://docs.valence.desire2learn.com/res/dropbox.html#get--d2l-api-le-(version)-(orgUnitId)-dropbox-folders-(folderId)-submissions-
	 */
	async listSubmissions(
		orgUnitId: number,
		folderId: number
	): Promise<DropboxEntitySubmission[]> {
		return this.get<DropboxEntitySubmission[]>(
			"le",
			`${orgUnitId}/dropbox/folders/${folderId}/submissions/`
		);
	}

	// ---------------------------------------------------------------------------
	// Feedback
	// ---------------------------------------------------------------------------

	/**
	 * Retrieve feedback for a specific user on a dropbox folder.
	 * GET /d2l/api/le/(version)/(orgUnitId)/dropbox/folders/(folderId)/feedback/user/(userId)
	 * @see https://docs.valence.desire2learn.com/res/dropbox.html#get--d2l-api-le-(version)-(orgUnitId)-dropbox-folders-(folderId)-feedback-user-(userId)
	 */
	async retrieveFeedback(
		orgUnitId: number,
		folderId: number,
		userId: number
	): Promise<DropboxFeedback> {
		return this.get<DropboxFeedback>(
			"le",
			`${orgUnitId}/dropbox/folders/${folderId}/feedback/user/${userId}`
		);
	}

	// ---------------------------------------------------------------------------
	// Folder Categories
	// ---------------------------------------------------------------------------

	/**
	 * Retrieve all folder categories for a course.
	 * GET /d2l/api/le/(version)/(orgUnitId)/dropbox/categories/
	 * @see https://docs.valence.desire2learn.com/res/dropbox.html#get--d2l-api-le-(version)-(orgUnitId)-dropbox-categories-
	 */
	async listCategories(orgUnitId: number): Promise<DropboxFolderCategory[]> {
		return this.get<DropboxFolderCategory[]>(
			"le",
			`${orgUnitId}/dropbox/categories/`
		);
	}

	/**
	 * Retrieve a specific folder category.
	 * GET /d2l/api/le/(version)/(orgUnitId)/dropbox/categories/(categoryId)
	 * @see https://docs.valence.desire2learn.com/res/dropbox.html#get--d2l-api-le-(version)-(orgUnitId)-dropbox-categories-(categoryId)
	 */
	async retrieveCategory(
		orgUnitId: number,
		categoryId: number
	): Promise<DropboxFolderCategory> {
		return this.get<DropboxFolderCategory>(
			"le",
			`${orgUnitId}/dropbox/categories/${categoryId}`
		);
	}

	/**
	 * Create a folder category.
	 * POST /d2l/api/le/(version)/(orgUnitId)/dropbox/categories/
	 * @see https://docs.valence.desire2learn.com/res/dropbox.html#post--d2l-api-le-(version)-(orgUnitId)-dropbox-categories-
	 */
	async createCategory(
		orgUnitId: number,
		data: DropboxFolderCategoryData
	): Promise<DropboxFolderCategory> {
		return this.post<DropboxFolderCategory>(
			"le",
			`${orgUnitId}/dropbox/categories/`,
			data
		);
	}

	/**
	 * Update a folder category.
	 * PUT /d2l/api/le/(version)/(orgUnitId)/dropbox/categories/(categoryId)
	 * @see https://docs.valence.desire2learn.com/res/dropbox.html#put--d2l-api-le-(version)-(orgUnitId)-dropbox-categories-(categoryId)
	 */
	async updateCategory(
		orgUnitId: number,
		categoryId: number,
		data: DropboxFolderCategoryData
	): Promise<void> {
		return this.put<void>(
			"le",
			`${orgUnitId}/dropbox/categories/${categoryId}`,
			data
		);
	}

	/**
	 * Delete a folder category.
	 * DELETE /d2l/api/le/(version)/(orgUnitId)/dropbox/categories/(categoryId)
	 * @see https://docs.valence.desire2learn.com/res/dropbox.html#delete--d2l-api-le-(version)-(orgUnitId)-dropbox-categories-(categoryId)
	 */
	async delCategory(orgUnitId: number, categoryId: number): Promise<void> {
		return this.delete<void>(
			"le",
			`${orgUnitId}/dropbox/categories/${categoryId}`
		);
	}

	// ---------------------------------------------------------------------------
	// Pagination internals
	// ---------------------------------------------------------------------------

	private async fetchFoldersPage(
		orgUnitId: number,
		params: ListDropboxFoldersParams
	): Promise<PaginatedPageResponse<DropboxFolder>> {
		const query = buildQueryString({ bookmark: params.bookmark });
		const raw = await this.get<D2LPageResponse<DropboxFolder>>(
			"le",
			`${orgUnitId}/dropbox/folders/${query}`
		);
		return {
			items: raw.Objects,
			hasMore: raw.HasMoreItems,
			next:
				raw.HasMoreItems && raw.Bookmark
					? () =>
							this.fetchFoldersPage(orgUnitId, {
								...params,
								bookmark: raw.Bookmark,
							})
					: undefined,
		};
	}
}
