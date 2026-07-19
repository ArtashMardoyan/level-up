package interview

import "testing"

func TestParseEval(t *testing.T) {
	tests := []struct {
		name    string
		content string
		wantErr bool
	}{
		{
			name:    "valid",
			content: `{"version":"2.0","score":84,"correctness":88,"depth":80,"communication":82,"structure":85,"confidence":"high","feedback":"Good answer.","strengths":["clear"],"weaknesses":["shallow"]}`,
		},
		{
			name:    "valid with code fence trimmed to raw",
			content: "  {\"score\":50,\"correctness\":50,\"depth\":50,\"communication\":50,\"structure\":50,\"feedback\":\"ok\",\"strengths\":[],\"weaknesses\":[]}  ",
		},
		{
			name:    "invalid json",
			content: `not json`,
			wantErr: true,
		},
		{
			name:    "score out of range",
			content: `{"score":140,"correctness":50,"depth":50,"communication":50,"structure":50,"feedback":"x"}`,
			wantErr: true,
		},
		{
			name:    "negative score",
			content: `{"score":-5,"correctness":50,"depth":50,"communication":50,"structure":50,"feedback":"x"}`,
			wantErr: true,
		},
		{
			name:    "empty feedback",
			content: `{"score":50,"correctness":50,"depth":50,"communication":50,"structure":50,"feedback":"  "}`,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parseEval(tt.content)
			if tt.wantErr {
				if err == nil {
					t.Fatalf("expected error, got none")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got.Version != SchemaVersion {
				t.Errorf("version = %q, want %q", got.Version, SchemaVersion)
			}
			if got.Strengths == nil || got.Weaknesses == nil {
				t.Errorf("strengths/weaknesses must be non-nil slices")
			}
		})
	}
}
