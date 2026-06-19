import { BaseResource } from "../core/resource";
import type { PaginatedList } from "../types";
import {
	type D2LPageResponse,
	type PaginatedPageResponse,
	CursorPaginatedList,
} from "../core/paginated-list";
import { buildQueryString } from "../core/utils";

// ---------------------------------------------------------------------------
// Wire types — matched exactly to D2L Quiz API response shapes
// @see https://docs.valence.desire2learn.com/res/quiz.html
// ---------------------------------------------------------------------------

/**
 * LATESUBMISSIONOPTION_T
 * Note: UseLateLimit (1) is no longer supported as of LE API v1.71 —
 * the back-end will treat it as AutoSubmitAttempt (2).
 */
export const LateSubmissionOption = {
	AllowNormalSubmission: 0,
	UseLateLimit: 1, // deprecated as of LE API v1.71
	AutoSubmitAttempt: 2,
} as const;
export type LateSubmissionOption =
	(typeof LateSubmissionOption)[keyof typeof LateSubmissionOption];

/** OVERALLGRADECALCULATION_T — grade calculation when multiple attempts allowed */
export const OverallGradeCalculation = {
	HighestAttempt: 1,
	LowestAttempt: 2,
	AverageOfAllAttempts: 3,
	FirstAttempt: 4,
	LastAttempt: 5,
} as const;
export type OverallGradeCalculation =
	(typeof OverallGradeCalculation)[keyof typeof OverallGradeCalculation];

/** QUIZPAGINGTYPEID_T — page break configuration for New Quiz Experience */
export const QuizPagingType = {
	AllQuestionsOnOnePage: 0,
	OneQuestionPerPage: 1,
	PageBreaksAfterEachSection: 2,
	FiveQuestionsPerPage: 3,
	TenQuestionsPerPage: 4,
} as const;
export type QuizPagingType =
	(typeof QuizPagingType)[keyof typeof QuizPagingType];

/** QUESTION_T — supported question type discriminator values */
export const QuestionType = {
	MultipleChoice: 1,
	TrueFalse: 2,
	FillInTheBlank: 3,
	MultiSelect: 4,
	Matching: 5, // QuestionInfo is null for this type
	Ordering: 6, // QuestionInfo is null for this type
	LongAnswer: 7,
	ShortAnswer: 8,
	Likert: 9,
	ImageInfo: 10, // QuestionInfo is null for this type
	TextInfo: 11, // QuestionInfo is null for this type
	Arithmetic: 12, // QuestionInfo is null for this type
	SignificantFigures: 13, // QuestionInfo is null for this type
	MultiShortAnswer: 14,
} as const;
export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

export interface RichText {
	Text: string;
	Html: string | null;
}

export interface RichTextInput {
	Content: string;
	Type: "Text" | "Html";
}

export interface QuizRichTextSection {
	Text: RichText;
	IsDisplayed: boolean;
}

export interface QuizRichTextInputSection {
	Text: RichTextInput;
	IsDisplayed: boolean;
}

export interface QuizAttemptsAllowed {
	IsUnlimited: boolean;
	/** null when IsUnlimited is true; between 1–10 when false */
	NumberOfAttemptsAllowed: number | null;
}

export interface QuizLateSubmissionInfo {
	LateSubmissionOption: LateSubmissionOption;
	/** Ignored as of LE API v1.71 */
	LateLimitMinutes: number | null;
}

export interface QuizSubmissionTimeLimit {
	IsEnforced: boolean;
	ShowClock: boolean;
	/** In minutes. 0 = no time limit. Must be 1–9999 when IsEnforced is true. */
	TimeLimitValue: number;
}

export interface QuizIpRange {
	IPRangeStart: string;
	/** null = restrict all IPs after IPRangeStart */
	IPRangeEnd: string | null;
}

/**
 * Quiz.QuizReadData — returned by retrieve and list actions.
 * @see https://docs.valence.desire2learn.com/res/quiz.html#Quiz.QuizReadData
 */
export interface QuizReadData {
	QuizId: number;
	Name: string;
	IsActive: boolean;
	SortOrder: number;
	AutoExportToGrades: boolean | null;
	GradeItemId: number | null;
	IsAutoSetGraded: boolean;
	Instructions: QuizRichTextSection;
	Description: QuizRichTextSection;
	StartDate: string | null;
	EndDate: string | null;
	DueDate: string | null;
	DisplayInCalendar: boolean;
	AttemptsAllowed: QuizAttemptsAllowed;
	LateSubmissionInfo: QuizLateSubmissionInfo;
	SubmissionTimeLimit: QuizSubmissionTimeLimit;
	/** Ignored as of LE API v1.71 */
	SubmissionGracePeriod: number | null;
	Password: string | null;
	Header: QuizRichTextSection;
	Footer: QuizRichTextSection;
	AllowHints: boolean;
	DisableRightClick: boolean;
	DisablePagerAndAlerts: boolean;
	NotificationEmail: string | null;
	CalcTypeId: OverallGradeCalculation;
	RestrictIPAddressRange: QuizIpRange[] | null;
	CategoryId: number | null;
	PreventMovingBackwards: boolean;
	Shuffle: boolean;
	ActivityId: string | null;
	AllowOnlyUsersWithSpecialAccess: boolean;
	IsRetakeIncorrectOnly: boolean;
	/** null for quizzes using classic paging method */
	PagingTypeId: QuizPagingType | null;
	IsSynchronous: boolean;
	DeductionPercentage: number | null;
	HideQuestionPoints: boolean;
	/** Added with LMS v20.26.2. Requires IsSingleSession config enabled. */
	IsSingleSession: boolean;
}

/**
 * Quiz.QuizData — body for create and update actions.
 * Note: uses RichTextInput for rich text fields and NumberOfAttemptsAllowed
 * (not the AttemptsAllowed composite used in QuizReadData).
 * @see https://docs.valence.desire2learn.com/res/quiz.html#Quiz.QuizData
 */
export interface QuizData {
	Name: string;
	IsActive: boolean;
	SortOrder: number;
	AutoExportToGrades: boolean | null;
	GradeItemId: number | null;
	IsAutoSetGraded: boolean;
	Instructions: QuizRichTextInputSection;
	Description: QuizRichTextInputSection;
	StartDate: string | null;
	EndDate: string | null;
	DueDate: string | null;
	DisplayInCalendar: boolean;
	/** null = unlimited; 1–10 when limited */
	NumberOfAttemptsAllowed: number | null;
	LateSubmissionInfo: QuizLateSubmissionInfo;
	SubmissionTimeLimit: QuizSubmissionTimeLimit;
	/** Ignored as of LE API v1.71 */
	SubmissionGracePeriod: number | null;
	/** Must not be empty string or whitespace if not null */
	Password: string | null;
	Header: QuizRichTextInputSection;
	Footer: QuizRichTextInputSection;
	AllowHints: boolean;
	DisableRightClick: boolean;
	DisablePagerAndAlerts: boolean;
	/** Must be a valid email address if not null */
	NotificationEmail: string | null;
	CalcTypeId: OverallGradeCalculation;
	RestrictIPAddressRange: QuizIpRange[] | null;
	CategoryId: number | null;
	PreventMovingBackwards: boolean;
	Shuffle: boolean;
	AllowOnlyUsersWithSpecialAccess: boolean;
	IsRetakeIncorrectOnly: boolean;
	/** Added with LE API v1.78. Setting null resets to 0 for classic quizzes. */
	PagingTypeId: QuizPagingType | null;
	IsSynchronous: boolean;
	/** 0–100 if not null */
	DeductionPercentage: number | null;
	/** Added with LE API v1.88. Required as of v1.88. */
	HideQuestionPoints: boolean;
	/** Added with LE API v1.92. Required as of v1.92. */
	IsSingleSession: boolean;
}

/**
 * Quiz.QuizAttemptData — returned by attempt retrieve actions.
 * @see https://docs.valence.desire2learn.com/res/quiz.html#Quiz.QuizAttemptData
 */
export interface QuizAttemptData {
	AttemptId: number;
	QuizId: number;
	UserId: number;
	AttemptNumber: number;
	Score: number | null;
	Started: string;
	/** null if the attempt is still in progress */
	Completed: string | null;
	AttemptFeedback: RichText;
	FeedbackLastModified: string | null;
	/** When true, feedback is visible to the student */
	IsPublished: boolean;
	IsRetakeIncorrectOnly: boolean;
	AttemptDueDate: string | null;
	AttemptEnforceTimeLimit: boolean;
	AttemptSubmissionTimeLimit: number;
	AttemptSubmissionGraceLimit: number;
	/** See LateSubmissionOption for values */
	AttemptSubmissionLateTypeId: number;
	/** Extended deadline in minutes for this attempt */
	AttemptSubmissionLateData: number;
	AttemptIsSynchronous: boolean;
	DeductionPercentage: number | null;
}

/**
 * Quiz.QuizCategoryReadData — returned by category retrieve actions.
 * @see https://docs.valence.desire2learn.com/res/quiz.html#Quiz.QuizCategoryReadData
 */
export interface QuizCategoryReadData {
	CategoryId: number;
	Name: string;
	SortOrder: number;
}

/**
 * Quiz.QuizCategoryData — body for create and update category actions.
 * @see https://docs.valence.desire2learn.com/res/quiz.html#Quiz.QuizCategoryData
 */
export interface QuizCategoryData {
	Name: string;
	SortOrder: number;
}

export interface ListQuizzesParams {
	bookmark?: string;
}

export interface ListAttemptsParams {
	userId?: number;
	bookmark?: string;
}

// ---------------------------------------------------------------------------
// Resource
// ---------------------------------------------------------------------------

export class QuizzesResource extends BaseResource {
	// ---------------------------------------------------------------------------
	// Quizzes
	// ---------------------------------------------------------------------------

	/**
	 * Retrieve all quizzes for a course.
	 * GET /d2l/api/le/(version)/(orgUnitId)/quizzes/
	 * @see https://docs.valence.desire2learn.com/res/quiz.html#get--d2l-api-le-(version)-(orgUnitId)-quizzes-
	 */
	async list(
		orgUnitId: number,
		params: ListQuizzesParams = {}
	): Promise<PaginatedList<QuizReadData>> {
		const page = await this.fetchQuizzesPage(orgUnitId, params);
		return new CursorPaginatedList(page.items, page.hasMore, page.next);
	}

	/**
	 * Retrieve a specific quiz.
	 * GET /d2l/api/le/(version)/(orgUnitId)/quizzes/(quizId)
	 * @see https://docs.valence.desire2learn.com/res/quiz.html#get--d2l-api-le-(version)-(orgUnitId)-quizzes-(quizId)
	 */
	async retrieve(orgUnitId: number, quizId: number): Promise<QuizReadData> {
		return this.get<QuizReadData>("le", `${orgUnitId}/quizzes/${quizId}`);
	}

	/**
	 * Create a new quiz.
	 * POST /d2l/api/le/(version)/(orgUnitId)/quizzes/
	 * @see https://docs.valence.desire2learn.com/res/quiz.html#post--d2l-api-le-(version)-(orgUnitId)-quizzes-
	 */
	async create(orgUnitId: number, data: QuizData): Promise<QuizReadData> {
		return this.post<QuizReadData>("le", `${orgUnitId}/quizzes/`, data);
	}

	/**
	 * Update a quiz.
	 * PUT /d2l/api/le/(version)/(orgUnitId)/quizzes/(quizId)
	 * @see https://docs.valence.desire2learn.com/res/quiz.html#put--d2l-api-le-(version)-(orgUnitId)-quizzes-(quizId)
	 */
	async update(
		orgUnitId: number,
		quizId: number,
		data: QuizData
	): Promise<void> {
		return this.put<void>("le", `${orgUnitId}/quizzes/${quizId}`, data);
	}

	/**
	 * Delete a quiz.
	 * DELETE /d2l/api/le/(version)/(orgUnitId)/quizzes/(quizId)
	 * @see https://docs.valence.desire2learn.com/res/quiz.html#delete--d2l-api-le-(version)-(orgUnitId)-quizzes-(quizId)
	 */
	async del(orgUnitId: number, quizId: number): Promise<void> {
		return this.delete<void>("le", `${orgUnitId}/quizzes/${quizId}`);
	}

	// ---------------------------------------------------------------------------
	// Quiz Attempts
	// ---------------------------------------------------------------------------

	/**
	 * Retrieve all attempts for a quiz, optionally filtered by user.
	 * GET /d2l/api/le/(version)/(orgUnitId)/quizzes/(quizId)/attempts/
	 * @see https://docs.valence.desire2learn.com/res/quiz.html#get--d2l-api-le-(version)-(orgUnitId)-quizzes-(quizId)-attempts-
	 */
	async listAttempts(
		orgUnitId: number,
		quizId: number,
		params: ListAttemptsParams = {}
	): Promise<PaginatedList<QuizAttemptData>> {
		const page = await this.fetchAttemptsPage(orgUnitId, quizId, params);
		return new CursorPaginatedList(page.items, page.hasMore, page.next);
	}

	/**
	 * Retrieve a specific quiz attempt.
	 * GET /d2l/api/le/(version)/(orgUnitId)/quizzes/(quizId)/attempts/(attemptId)
	 * @see https://docs.valence.desire2learn.com/res/quiz.html#get--d2l-api-le-(version)-(orgUnitId)-quizzes-(quizId)-attempts-(attemptId)
	 */
	async retrieveAttempt(
		orgUnitId: number,
		quizId: number,
		attemptId: number
	): Promise<QuizAttemptData> {
		return this.get<QuizAttemptData>(
			"le",
			`${orgUnitId}/quizzes/${quizId}/attempts/${attemptId}`
		);
	}

	// ---------------------------------------------------------------------------
	// Quiz Categories
	// ---------------------------------------------------------------------------

	/**
	 * Retrieve all quiz categories for a course.
	 * GET /d2l/api/le/(version)/(orgUnitId)/quizzes/categories/
	 * @see https://docs.valence.desire2learn.com/res/quiz.html#get--d2l-api-le-(version)-(orgUnitId)-quizzes-categories-
	 */
	async listCategories(orgUnitId: number): Promise<QuizCategoryReadData[]> {
		return this.get<QuizCategoryReadData[]>(
			"le",
			`${orgUnitId}/quizzes/categories/`
		);
	}

	/**
	 * Retrieve a specific quiz category.
	 * GET /d2l/api/le/(version)/(orgUnitId)/quizzes/categories/(categoryId)
	 * @see https://docs.valence.desire2learn.com/res/quiz.html#get--d2l-api-le-(version)-(orgUnitId)-quizzes-categories-(categoryId)
	 */
	async retrieveCategory(
		orgUnitId: number,
		categoryId: number
	): Promise<QuizCategoryReadData> {
		return this.get<QuizCategoryReadData>(
			"le",
			`${orgUnitId}/quizzes/categories/${categoryId}`
		);
	}

	/**
	 * Create a quiz category.
	 * POST /d2l/api/le/(version)/(orgUnitId)/quizzes/categories/
	 * @see https://docs.valence.desire2learn.com/res/quiz.html#post--d2l-api-le-(version)-(orgUnitId)-quizzes-categories-
	 */
	async createCategory(
		orgUnitId: number,
		data: QuizCategoryData
	): Promise<QuizCategoryReadData> {
		return this.post<QuizCategoryReadData>(
			"le",
			`${orgUnitId}/quizzes/categories/`,
			data
		);
	}

	/**
	 * Update a quiz category.
	 * PUT /d2l/api/le/(version)/(orgUnitId)/quizzes/categories/(categoryId)
	 * @see https://docs.valence.desire2learn.com/res/quiz.html#put--d2l-api-le-(version)-(orgUnitId)-quizzes-categories-(categoryId)
	 */
	async updateCategory(
		orgUnitId: number,
		categoryId: number,
		data: QuizCategoryData
	): Promise<void> {
		return this.put<void>(
			"le",
			`${orgUnitId}/quizzes/categories/${categoryId}`,
			data
		);
	}

	/**
	 * Delete a quiz category.
	 * DELETE /d2l/api/le/(version)/(orgUnitId)/quizzes/categories/(categoryId)
	 * @see https://docs.valence.desire2learn.com/res/quiz.html#delete--d2l-api-le-(version)-(orgUnitId)-quizzes-categories-(categoryId)
	 */
	async delCategory(orgUnitId: number, categoryId: number): Promise<void> {
		return this.delete<void>(
			"le",
			`${orgUnitId}/quizzes/categories/${categoryId}`
		);
	}

	// ---------------------------------------------------------------------------
	// Pagination internals
	// ---------------------------------------------------------------------------

	private async fetchQuizzesPage(
		orgUnitId: number,
		params: ListQuizzesParams
	): Promise<PaginatedPageResponse<QuizReadData>> {
		const query = buildQueryString({ bookmark: params.bookmark });
		const raw = await this.get<D2LPageResponse<QuizReadData>>(
			"le",
			`${orgUnitId}/quizzes/${query}`
		);
		return {
			items: raw.Objects,
			hasMore: raw.HasMoreItems,
			next:
				raw.HasMoreItems && raw.Bookmark
					? () =>
							this.fetchQuizzesPage(orgUnitId, {
								...params,
								bookmark: raw.Bookmark,
							})
					: undefined,
		};
	}

	private async fetchAttemptsPage(
		orgUnitId: number,
		quizId: number,
		params: ListAttemptsParams
	): Promise<PaginatedPageResponse<QuizAttemptData>> {
		const query = buildQueryString({
			userId: params.userId,
			bookmark: params.bookmark,
		});
		const raw = await this.get<D2LPageResponse<QuizAttemptData>>(
			"le",
			`${orgUnitId}/quizzes/${quizId}/attempts/${query}`
		);
		return {
			items: raw.Objects,
			hasMore: raw.HasMoreItems,
			next:
				raw.HasMoreItems && raw.Bookmark
					? () =>
							this.fetchAttemptsPage(orgUnitId, quizId, {
								...params,
								bookmark: raw.Bookmark,
							})
					: undefined,
		};
	}
}
