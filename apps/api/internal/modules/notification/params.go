package notification

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

// Params is a free-form JSON payload stored in a jsonb column and returned to
// the client verbatim as a JSON object. The client renders the localized text
// from the notification type + these params (e.g. {"count": 10}).
type Params map[string]any

func (p Params) Value() (driver.Value, error) {
	if p == nil {
		return "{}", nil
	}

	return json.Marshal(p)
}

func (p *Params) Scan(src any) error {
	if src == nil {
		*p = Params{}
		return nil
	}

	var bytes []byte
	switch v := src.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return errors.New("notification: unsupported Params scan type")
	}

	if len(bytes) == 0 {
		*p = Params{}
		return nil
	}

	return json.Unmarshal(bytes, p)
}
