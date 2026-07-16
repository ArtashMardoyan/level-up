package user

type CreateDTO struct {
	Name     string `json:"name"     binding:"required,min=2"`
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Age      int    `json:"age"      binding:"omitempty,min=1"`
}

type UpdateDTO struct {
	Name string `json:"name" binding:"omitempty,min=2"`
	Age  int    `json:"age"  binding:"omitempty,min=1"`
}
