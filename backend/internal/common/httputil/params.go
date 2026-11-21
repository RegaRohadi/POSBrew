package httputil

import (
	"net/http"
	"strconv"

	"POSBrew/internal/common/response"

	"github.com/gin-gonic/gin"
)

func ParseID(c *gin.Context, entity string) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		response.Error(c, http.StatusBadRequest, "invalid "+entity+" id")
		return 0, false
	}

	return uint(id), true
}
