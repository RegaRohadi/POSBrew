package database

import (
	"errors"

	"github.com/jackc/pgx/v5/pgconn"
)

// IsPGError memeriksa apakah error berasal dari PostgreSQL dengan kode tertentu.
func IsPGError(err error, code string) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == code
}

// TranslatePGError memetakan error PostgreSQL umum ke error domain.
// Bisa juga dipakai untuk kode lain lewat IsPGError.
func TranslatePGError(err error, uniqueErr, foreignKeyErr error) error {
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) {
		return err
	}

	switch pgErr.Code {
	case "23505":
		if uniqueErr != nil {
			return uniqueErr
		}
	case "23503":
		if foreignKeyErr != nil {
			return foreignKeyErr
		}
	}

	return err
}
