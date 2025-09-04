# API Specification

## REST API Specification

```yaml
openapi: 3.0.0
info:
  title: The Compass API
  version: 1.0.0
  description: REST API for AI-powered product validation platform
servers:
  - url: https://api.compass.vercel.app/v1
    description: Production API
  - url: http://localhost:3001/api/v1
    description: Development API

paths:
  /auth/session:
    get:
      summary: Get current user session
      tags: [Authentication]
      security:
        - ClerkAuth: []
      responses:
        '200':
          description: Current user session
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '401':
          description: Unauthorized

  /feature-briefs:
    get:
      summary: List user's feature briefs
      tags: [Feature Briefs]
      security:
        - ClerkAuth: []
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [draft, submitted, validated]
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: List of feature briefs
    
    post:
      summary: Create new feature brief
      tags: [Feature Briefs]
      security:
        - ClerkAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/FeatureBriefInput'
      responses:
        '201':
          description: Created feature brief

  /feature-briefs/{id}:
    get:
      summary: Get feature brief by ID
      tags: [Feature Briefs]
      security:
        - ClerkAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Feature brief details
        '404':
          description: Feature brief not found

    put:
      summary: Update feature brief
      tags: [Feature Briefs]
      security:
        - ClerkAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/FeatureBriefInput'
      responses:
        '200':
          description: Updated feature brief

  /feature-briefs/{id}/validate:
    post:
      summary: Submit feature brief for validation
      tags: [Validation]
      security:
        - ClerkAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                personaId:
                  type: string
                  description: ID of persona to interview
      responses:
        '202':
          description: Validation started

  /validations/{id}:
    get:
      summary: Get validation brief
      tags: [Validation]
      security:
        - ClerkAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Validation brief

  /validations/{id}/export:
    post:
      summary: Export validation brief
      tags: [Validation]
      security:
        - ClerkAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                format:
                  type: string
                  enum: [pdf, markdown]
      responses:
        '200':
          description: Export URL

  /personas:
    get:
      summary: List available personas
      tags: [Personas]
      responses:
        '200':
          description: List of personas

  /search:
    get:
      summary: Search validation history
      tags: [Search]
      security:
        - ClerkAuth: []
      parameters:
        - name: q
          in: query
          required: true
          schema:
            type: string
            description: Search query
        - name: type
          in: query
          schema:
            type: string
            enum: [feature_brief, validation]
      responses:
        '200':
          description: Search results

components:
  securitySchemes:
    ClerkAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      $ref: '#/components/schemas/User'
    FeatureBrief:
      $ref: '#/components/schemas/FeatureBrief'
    FeatureBriefInput:
      $ref: '#/components/schemas/FeatureBriefInput'
    ValidationBrief:
      $ref: '#/components/schemas/ValidationBrief'
    Persona:
      $ref: '#/components/schemas/Persona'
```
