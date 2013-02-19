package org.bimsurfer;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.IOUtils;
import org.bimserver.models.store.ObjectDefinition;
import org.bimserver.plugins.PluginContext;
import org.bimserver.plugins.PluginException;
import org.bimserver.plugins.PluginManager;
import org.bimserver.plugins.web.WebModulePlugin;

public class BimSurferWebModulePlugin implements WebModulePlugin {

	private boolean initialized;
	private PluginContext pluginContext;

	@Override
	public void init(PluginManager pluginManager) throws PluginException {
		pluginContext = pluginManager.getPluginContext(this);
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
	public ObjectDefinition getSettingsDefinition() {
		return null;
	}

	@Override
	public boolean isInitialized() {
		return initialized;
	}

	@Override
	public void service(HttpServletRequest request, HttpServletResponse response) {
		try {
			InputStream resourceAsInputStream = pluginContext.getResourceAsInputStream(request.getPathInfo());
			if (resourceAsInputStream != null) {
				IOUtils.copy(resourceAsInputStream, response.getOutputStream());
			}
		} catch (FileNotFoundException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	@Override
	public String getContextPath() {
		return "/bimsurfer/*";
	}
}