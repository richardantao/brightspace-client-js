import { BaseResource } from "../core/resource";
import { buildQueryString } from "../core/utils";

// ---------------------------------------------------------------------------
// Wire types — matched exactly to D2L Assessment/Rubric API response shapes
// @see https://docs.valence.desire2learn.com/res/assessment.html
// ---------------------------------------------------------------------------

/**
 * ASSESSMENT_T — the kind of assessment that can be performed.
 * Currently only Rubric is supported.
 */
export type AssessmentType = "Rubric";

/**
 * EVAL_T — object types that can be evaluated by rubrics.
 * The entity ID from the associated entity can be used directly in
 * the corresponding resource API calls.
 */
export type EvalObjectType =
	| "Dropbox"
	| "ManualAssessment"
	| "Quiz"
	| "Survey"
	| "Discussion"
	| "Grades"
	| "ContentObject";

/**
 * RUBRIC_T — rubric scoring structure type.
 */
export const RubricType = {
	Holistic: 0,
	Analytic: 1,
} as const;
export type RubricType = (typeof RubricType)[keyof typeof RubricType];

/**
 * SCORING_M — scoring method for rubric assessment.
 */
export const ScoringMethod = {
	TextOnly: 0,
	Points: 1,
	TextAndNumeric: 2,
	CustomPoints: 3,
} as const;
export type ScoringMethod = (typeof ScoringMethod)[keyof typeof ScoringMethod];

/**
 * RUBRIC_STATE_ID_M — rubric lifecycle state.
 */
export const RubricState = {
	Published: 0,
	Archived: 1,
	Draft: 2,
} as const;
export type RubricState = (typeof RubricState)[keyof typeof RubricState];

/**
 * VISIBILITY_M — rubric visibility to assessed users.
 * Added with LMS 20.26.4.
 */
export const RubricVisibility = {
	AlwaysVisible: 0,
	VisibleOnceFeedbackPosted: 1,
	NeverVisible: 2,
} as const;
export type RubricVisibility =
	(typeof RubricVisibility)[keyof typeof RubricVisibility];

export interface RichText {
	Text: string;
	Html: string | null;
}

/**
 * Rubric.Level — a performance level within a rubric criteria group.
 * @see https://docs.valence.desire2learn.com/res/assessment.html#Rubric.Level
 */
export interface RubricLevel {
	Id: number;
	Name: string;
	Points: number | null;
}

/**
 * Rubric.OverallLevel — a top-level performance outcome for holistic rubrics.
 * @see https://docs.valence.desire2learn.com/res/assessment.html#Rubric.OverallLevel
 */
export interface RubricOverallLevel {
	Id: number;
	Name: string;
	RangeStart: number | null;
	Description: RichText;
	Feedback: RichText;
}

/** A single cell in a rubric criterion (feedback + description + optional points) */
export interface RubricCriterionCell {
	Feedback: RichText;
	Description: RichText;
	Points: number | null;
}

/** A single criterion row in a criteria group */
export interface RubricCriterion {
	Id: number;
	Name: string;
	/** One cell per level in the group */
	Cells: RubricCriterionCell[];
}

/**
 * Rubric.CriteriaGroup — a named group of criteria with associated levels.
 * @see https://docs.valence.desire2learn.com/res/assessment.html#Rubric.CriteriaGroup
 */
export interface RubricCriteriaGroup {
	Name: string;
	Levels: RubricLevel[];
	Criteria: RubricCriterion[];
}

/**
 * Rubric.Rubric — a complete rubric definition without an attached assessment.
 * @see https://docs.valence.desire2learn.com/res/assessment.html#Rubric.Rubric
 */
export interface Rubric {
	RubricId: number;
	Name: string;
	Description: RichText;
	RubricType: RubricType;
	RubricStateId: RubricState;
	ScoringMethod: ScoringMethod;
	/** Added with LMS 20.26.4 */
	Visibility: RubricVisibility;
	IsScoreVisibleToAssessedUsers: boolean;
	/** Added with LMS 20.26.4 */
	ReverseLevelDisplayOrder: boolean;
	CriteriaGroups: RubricCriteriaGroup[];
	OverallLevels: RubricOverallLevel[];
}

/** A single criterion outcome within a rubric assessment */
export interface RubricCriterionOutcome {
	CriterionId: number;
	LevelId: number | null;
	Score: number | null;
	ScoreIsOverridden: boolean;
	Feedback: RichText;
	FeedbackIsOverridden: boolean;
}

/**
 * Rubric.RubricAssessment — an assessment with accompanying rubric results.
 * @see https://docs.valence.desire2learn.com/res/assessment.html#Rubric.RubricAssessment
 */
export interface RubricAssessment {
	RubricId: number;
	UserId: number;
	ObjectType: string;
	ObjectId: number;
	OverallOutcome: {
		LevelId: number;
		Score: number | null;
		ScoreIsOverridden: boolean;
		Feedback: RichText;
		FeedbackIsOverridden: boolean;
		AssessorId: number;
		AutoCalculate: boolean | null;
	};
	CriteriaOutcome: RubricCriterionOutcome[];
}

export interface RetrieveRubricsParams {
	objectType: EvalObjectType;
	objectId: number;
}

export interface RetrieveAssessmentParams {
	assessmentType: AssessmentType;
	objectType: EvalObjectType;
	objectId: number;
	rubricId: number;
	userId: number;
}

export interface UpdateAssessmentParams {
	objectType: EvalObjectType;
	objectId: number;
	userId: number;
}

export class AssessmentsResource extends BaseResource {
	/**
	 * Retrieve rubrics associated with a specific object in an org unit.
	 * Requires LE API v1.93+ (LMS v20.26.4+).
	 * GET /d2l/api/le/(version)/(orgUnitId)/rubrics?objectType=&objectId=
	 * @see https://docs.valence.desire2learn.com/res/assessment.html#get--d2l-api-le-(version)-(orgUnitId)-rubrics
	 */
	async listRubrics(
		orgUnitId: number,
		params: RetrieveRubricsParams
	): Promise<Rubric[]> {
		const query = buildQueryString({
			objectType: params.objectType,
			objectId: params.objectId,
		});
		return this.get<Rubric[]>("le", `${orgUnitId}/rubrics${query}`);
	}

	/**
	 * Retrieve a rubric assessment for a specific user and object.
	 * Requires LE API v1.93+ (LMS v20.26.4+).
	 * GET /d2l/api/le/(version)/(orgUnitId)/assessment?assessmentType=&objectType=&objectId=&rubricId=&userId=
	 * @see https://docs.valence.desire2learn.com/res/assessment.html#get--d2l-api-le-(version)-(orgUnitId)-assessment
	 */
	async retrieveAssessment(
		orgUnitId: number,
		params: RetrieveAssessmentParams
	): Promise<RubricAssessment> {
		const query = buildQueryString({
			assessmentType: params.assessmentType,
			objectType: params.objectType,
			objectId: params.objectId,
			rubricId: params.rubricId,
			userId: params.userId,
		});
		return this.get<RubricAssessment>("le", `${orgUnitId}/assessment${query}`);
	}

	/**
	 * Update a rubric assessment for a specific user and object.
	 * Requires LE API v1.93+ (LMS v20.26.4+).
	 * PUT /d2l/api/le/(version)/(orgUnitId)/assessment?objectType=&objectId=&userId=
	 * @see https://docs.valence.desire2learn.com/res/assessment.html#put--d2l-api-le-(version)-(orgUnitId)-assessment
	 */
	async updateAssessment(
		orgUnitId: number,
		params: UpdateAssessmentParams,
		data: RubricAssessment
	): Promise<RubricAssessment> {
		const query = buildQueryString({
			objectType: params.objectType,
			objectId: params.objectId,
			userId: params.userId,
		});
		return this.put<RubricAssessment>(
			"le",
			`${orgUnitId}/assessment${query}`,
			data
		);
	}
}
