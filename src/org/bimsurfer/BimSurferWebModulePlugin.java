package org.bimsurfer;

import org.bimserver.plugins.PluginException;
import org.bimserver.plugins.PluginManager;
import org.bimserver.plugins.web.AbstractWebModulePlugin;

public class BimSurferWebModulePlugin extends AbstractWebModulePlugin {

	private boolean initialized;

	@Override
	public void init(PluginManager pluginManager) throws PluginException {
		super.init(pluginManager);
		initialized = true;
	}

	@Override
	public String getDescription() {
		return "BIMsurfer";
	}

	@Override
	public String getDefaultName() {
		return "BIMsurfer";
	}

	@Override
	public String getVersion() {
		return "1.0";
	}

	@Override
	public boolean isInitialized() {
		return initialized;
	}

	@Override
	public String getDefaultContextPath() {
		return "/bimsurfer";
	}

	@Override
	public String getIdentifier() {
		return "bimsurfer";
	}
}