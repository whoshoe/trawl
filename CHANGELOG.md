# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release with 4-tier execution engine
- Persistent browser pool with real Google Chrome
- Session caching via Redis
- FlareSolverr v2-compatible `/v1` endpoint
- WebSocket live scrape streaming at `/scrape/live`
- Self-healing browser pool with automatic restart on crash
- Sticky domain routing to maximize session cache hits
- Nuxt 4 landing page with live stats
- VitePress documentation site
- Docker Compose deployment with amd64 platform targeting for Chrome compatibility
