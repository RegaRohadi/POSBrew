package middleware

import (
	"net/http"
	"strings"

	"POSBrew/internal/auth"
	"POSBrew/internal/common/response"

	"github.com/gin-gonic/gin"
)

const (
	ContextUserID = "user_id"
	ContextRole   = "role"
)

func Authenticate(tokens *auth.TokenService) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			response.Error(c, http.StatusUnauthorized, "missing or invalid authorization header")
			c.Abort()
			return
		}

		tokenString := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
		claims, err := tokens.Parse(tokenString)
		if err != nil {
			response.Error(c, http.StatusUnauthorized, err.Error())
			c.Abort()
			return
		}

		c.Set(ContextUserID, claims.UserID)
		c.Set(ContextRole, claims.Role)
		c.Next()
	}
}

func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString(ContextRole)
		for _, allowed := range roles {
			if role == allowed {
				c.Next()
				return
			}
		}

		response.Error(c, http.StatusForbidden, "forbidden")
		c.Abort()
	}
}

func UserID(c *gin.Context) uint {
	value, ok := c.Get(ContextUserID)
	if !ok {
		return 0
	}

	id, _ := value.(uint)
	return id
}
