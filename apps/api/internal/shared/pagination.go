package shared

type PaginationQuery struct {
	Page  int `form:"page"`
	Limit int `form:"limit"`
}

func (q *PaginationQuery) Normalize() {
	if q.Page < 1 {
		q.Page = 1
	}
	if q.Limit < 1 || q.Limit > 100 {
		q.Limit = 10
	}
}

func (q *PaginationQuery) Offset() int {
	return (q.Page - 1) * q.Limit
}

type PaginationMeta struct {
	Page  int   `json:"page"`
	Limit int   `json:"limit"`
	Total int64 `json:"total"`
}

type PaginatedResult[T any] struct {
	Items []T            `json:"items"`
	Meta  PaginationMeta `json:"meta"`
}

func NewPaginatedResult[T any](items []T, total int64, q PaginationQuery) PaginatedResult[T] {
	if items == nil {
		items = []T{}
	}
	return PaginatedResult[T]{
		Items: items,
		Meta:  PaginationMeta{Page: q.Page, Limit: q.Limit, Total: total},
	}
}
