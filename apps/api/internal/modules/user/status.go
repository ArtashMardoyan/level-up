package user

type Status string

const (
	StatusActivated   Status = "activated"
	StatusDeactivated Status = "deactivated"
)

var validStatuses = map[Status]bool{
	StatusActivated:   true,
	StatusDeactivated: true,
}

func (s Status) IsValid() bool {
	return validStatuses[s]
}
