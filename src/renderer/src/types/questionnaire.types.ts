export enum QuestionnaireResponseStatus {
    IN_PROGRESS = 'in-progress',
    COMPLETED = 'completed',
    AMENDED = 'amended',
    ENTERED_IN_ERROR = 'entered-in-error',
    STOPPED = 'stopped',
}

export interface QuestionnaireResponseItem {
    id?: string;
    questionnaireResponseId?: string;
    parentItemId?: string | null;
    linkId: string;
    text?: string;
    valueString?: string;
    valueBoolean?: boolean;
    valueInteger?: number;
    valueDecimal?: number;
    valueDateTime?: Date | string;
    valueCoding?: any;
    valueReference?: any;
    item?: QuestionnaireResponseItem[];
    answer?: { valueBoolean: any, item?: QuestionnaireResponseItem[] }[];
}

export interface QuestionnaireResponse {
    id?: string;
    encounterId?: string;
    subjectId: string;
    questionnaire?: string;
    status: QuestionnaireResponseStatus;
    authored?: Date | string;
    authorId?: string | number | null;
    sourceId?: string | number | null;
    okRequestId?: number | null;
    items?: QuestionnaireResponseItem[];
}

export interface CreateQuestionnaireResponsePayload {
    encounterId?: string;
    subjectId: string;
    questionnaire?: string;
    status?: QuestionnaireResponseStatus;
    authored?: Date | string;
    authorId?: string | number | null;
    sourceId?: string | number | null;
    okRequestId?: number | null;
    items: QuestionnaireResponseItem[];
}
