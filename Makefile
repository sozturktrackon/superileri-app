# Superileri Fit — one Makefile to rule the cloud.
# Deploys with AWS_PROFILE=sandbox in us-east-1 (your shell sets a different
# default region, so we pin it explicitly on every AWS-touching target).

AWS_PROFILE ?= sandbox
AWS_REGION  ?= us-east-1
export AWS_REGION
export AWS_DEFAULT_REGION = $(AWS_REGION)

# Resolve the media bucket from the generated outputs (after a deploy).
BUCKET = $(shell node -e "try{console.log(require('./amplify_outputs.json').storage.bucket_name)}catch(e){console.log('')}")

.PHONY: help install deploy backend backend-watch delete web web-build \
        web-preview host gen-videos gen-videos-sample upload-videos sandbox-info

COMFY_BASE ?= http://192.168.21.236:8082
VIDEO_OUT  ?= ./generated-videos
DIR        ?= $(VIDEO_OUT)

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## Install backend + web dependencies
	npm install
	cd web && npm install

deploy: backend ## Alias for `backend` (deploy cloud backend once)

backend: ## Deploy the Amplify backend once (Cognito + AppSync + DDB + S3 + fn)
	npx ampx sandbox --profile $(AWS_PROFILE) --once

backend-watch: ## Deploy backend and watch for changes (live dev)
	npx ampx sandbox --profile $(AWS_PROFILE)

delete: ## Tear down the cloud backend
	npx ampx sandbox delete --profile $(AWS_PROFILE)

web: ## Run the web app locally (phone-accessible via --host)
	cd web && npm run dev

web-build: ## Build the web app for production into web/dist
	cd web && npm run build

web-preview: ## Preview the production build locally
	cd web && npm run preview

host: ## Build + deploy the web app to Amplify Hosting (public URL)
	AWS_PROFILE=$(AWS_PROFILE) ./scripts/deploy-hosting.sh

gen-videos-sample: ## Generate 3 sample exercise videos on ComfyUI (to judge quality)
	node scripts/generate-videos.mjs --base $(COMFY_BASE) --out $(VIDEO_OUT) --sample

gen-videos: ## Generate ALL exercise videos on ComfyUI into $(VIDEO_OUT)
	node scripts/generate-videos.mjs --base $(COMFY_BASE) --out $(VIDEO_OUT) --all

# Upload exercise demo videos. Name each file <exerciseId>.mp4 (ids are in
# content/exercises.json). Usage: make upload-videos DIR=./my-videos
upload-videos: ## Upload exercise videos to S3 (DIR=./folder of <exerciseId>.mp4)
	@if [ -z "$(BUCKET)" ]; then echo "No bucket found — run 'make backend' first."; exit 1; fi
	@if [ -z "$(DIR)" ]; then echo "Usage: make upload-videos DIR=./folder-of-mp4s"; exit 1; fi
	aws s3 cp $(DIR) s3://$(BUCKET)/videos/ --recursive \
	  --exclude "*" --include "*.mp4" --profile $(AWS_PROFILE)
	@echo "Uploaded videos to s3://$(BUCKET)/videos/"

sandbox-info: ## Print key backend resource IDs
	@node -e "const o=require('./amplify_outputs.json'); \
	  console.log('Region:    ', o.auth.aws_region); \
	  console.log('UserPool:  ', o.auth.user_pool_id); \
	  console.log('GraphQL:   ', o.data.url); \
	  console.log('Bucket:    ', o.storage.bucket_name);"
