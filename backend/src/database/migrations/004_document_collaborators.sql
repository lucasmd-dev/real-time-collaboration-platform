CREATE TABLE document_collaborators (
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (document_id, user_id)
);

CREATE INDEX idx_document_collaborators_user_id ON document_collaborators(user_id);
CREATE INDEX idx_document_collaborators_document_id ON document_collaborators(document_id);
