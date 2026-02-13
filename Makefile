dev:
	$(MAKE) -j2 frontend-dev backend-dev

frontend-dev:
	cd frontend && npm run dev

backend-dev:
	cd backend && watchexec -r -w src -w migrations -e rs,sql,toml -- cargo run

setup:
	cd frontend && npm install
	cargo install watchexec-cli
	cargo install sqlx-cli --no-default-features --features postgres

db-migrate:
	cd backend && cargo sqlx migrate run
