package shared

import "github.com/gin-gonic/gin"

type errorResponse struct {
	Error string `json:"error"`
}

func OK(c *gin.Context, data any) {
	c.JSON(200, gin.H{"data": data})
}

func Created(c *gin.Context, data any) {
	c.JSON(201, gin.H{"data": data})
}

func NoContent(c *gin.Context) {
	c.Status(204)
}

func Error(c *gin.Context, status int, message string) {
	c.JSON(status, errorResponse{Error: message})
}
