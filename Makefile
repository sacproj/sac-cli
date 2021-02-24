# Paths
PWD := $(shell pwd)
BUILD_PATH := $(PWD)/build

# Tools
AWK := awk
CD := cd
CP := cp -f
COLUMN := column
GH := gh
GIT := git
MKDIR := mkdir -p
RM := rm -f
RMDIR := rm -rf
SED := sed
TAR := tar

# Default targets
_DEFAULT_GOAL: help

# Directories creation
$(BUILD_PATH):
	$(MKDIR) $@

# Release
.PHONY: check_version prepare-release publish-release

GIT_REMOTE = origin
GIT_URL = https://github.com/sacproj/sac-cli
RELEASE_ARTIFACTS = CHANGELOG.md LICENSE README.md pdf.js sac
RELEASE_TARBALL = $(BUILD_PATH)/sac-cli.tar.gz
SAC_CMD = sac
BUILD_SAC_CMD = $(BUILD_PATH)/sac

check_version:
	@if [ "$(VERSION)" == "" ]; then echo "VERSION must be defined"; exit 1; fi

## Prepare release (requires defined VERSION)
prepare-release: $(BUILD_PATH) check_version
	$(SED) -e "s|VERSION=\".*|VERSION=\"$(VERSION)\"|" $(SAC_CMD) > $(BUILD_SAC_CMD)
	$(CP) $(BUILD_SAC_CMD) $(SAC_CMD)
	$(GIT) add $(SAC_CMD)
	$(GIT) commit -s -m "release: $(VERSION)"
	$(GIT) push
	$(RM) $(RELEASE_TARBALL)
	$(TAR) cvzf $(RELEASE_TARBALL) $(RELEASE_ARTIFACTS)

## Publish release (requires defined VERSION)
publish-release: check_version
	$(GH) release create $(VERSION) -t $(VERSION) -n "See changes in [CHANGELOG.md]($(GIT_URL)/blob/$(VERSION)/CHANGELOG.md)"
	$(GH) release upload $(VERSION) $(RELEASE_TARBALL)

# Cleaning
.PHONY: clean clean-build
## Clean artifacts
clean: clean-build

clean-build:
	$(RMDIR) $(BUILD_PATH)

.PHONY: help
## Display this help message
help:
	$(info Available targets)
	@$(AWK) '/^[a-zA-Z\-\\_0-9]+:/ {                                   \
	  nb = sub( /^## /, "", helpMsg );                             \
	  if(nb == 0) {                                                \
	    helpMsg = $$0;                                             \
	    nb = sub( /^[^:]*:.* ## /, "", helpMsg );                  \
	  }                                                            \
	  if (nb)                                                      \
	    printf "\033[1;31m%-" width "s\033[0m %s\n", $$1, helpMsg; \
	}                                                              \
	{ helpMsg = $$0 }'                                             \
	$(MAKEFILE_LIST) | $(COLUMN) -ts:
