import * as React from "react";
import { shallow, mount, render } from "enzyme";
import { SelectionPanel } from "../src/components/selection-panel";
import { SelectedFeatureSet, SelectedFeature } from "../src/api/contracts/query";
import { tr } from "../src/api/i18n";

type ZoomFeatureFunc = (feat: SelectedFeature) => void;

function createSelectionSet(): SelectedFeatureSet {
    return {
        SelectedLayer: [
            {
                "@id": "1",
                "@name": "Foo",
                LayerMetadata: {
                    Property: [
                        { Name: "Autogenerated_SDF_ID", DisplayName: "ID", Type: 1 },
                        { Name: "Name", DisplayName: "Name", Type: 2 }
                    ]
                },
                Feature: [
                    {
                        Bounds: "1 2 3 4",
                        Property: [
                            { Name: "ID", Value: "1" },
                            { Name: "Name", Value: "Feature 1" }
                        ]
                    },
                    {
                        Bounds: "2 3 4 5",
                        Property: [
                            { Name: "ID", Value: "2" },
                            { Name: "Name", Value: "Feature 2" }
                        ]
                    }
                ]
            },
            {
                "@id": "2",
                "@name": "Bar",
                LayerMetadata: {
                    Property: [
                        { Name: "Autogenerated_SDF_ID", DisplayName: "ID", Type: 1 },
                        { Name: "Name", DisplayName: "Name", Type: 2 },
                        { Name: "Address", DisplayName: "Address", Type: 2 }
                    ]
                },
                Feature: [
                    {
                        Bounds: "1 2 3 4",
                        Property: [
                            { Name: "ID", Value: "1" },
                            { Name: "Name", Value: "Feature 1" },
                            { Name: "Address", Value: "Testing" }
                        ]
                    },
                    {
                        Bounds: "2 3 4 5",
                        Property: [
                            { Name: "ID", Value: "2" },
                            { Name: "Name", Value: "Feature 2" },
                            { Name: "Address", Value: "Testing" }
                        ]
                    }
                ]
            }
        ]
    };
}

describe("components/selection-panel", () => {
    it("null selection results in empty results message", () => {
        const onZoomRequest = jest.fn();
        const set: SelectedFeatureSet = {
            SelectedLayer: []
        };
        const wrapper = mount(<SelectionPanel selection={set} onRequestZoomToFeature={onZoomRequest} />);
        expect(wrapper.find(".selection-panel-toolbar")).toHaveLength(0);
        expect(wrapper.find(".selection-panel-property-grid")).toHaveLength(0);
        expect(wrapper.find(".selection-panel-no-selection")).toHaveLength(1);
        expect(wrapper.find(".selection-panel-no-selection").text()).toBe(tr("NO_SELECTED_FEATURES"));
    });
    it("Empty selection results in empty results message", () => {
        const onZoomRequest = jest.fn();
        const set: SelectedFeatureSet = {
            SelectedLayer: []
        };
        const wrapper = mount(<SelectionPanel selection={set} onRequestZoomToFeature={onZoomRequest} />);
        expect(wrapper.find(".selection-panel-toolbar")).toHaveLength(0);
        expect(wrapper.find(".selection-panel-property-grid")).toHaveLength(0);
        expect(wrapper.find(".selection-panel-no-selection")).toHaveLength(1);
        expect(wrapper.find(".selection-panel-no-selection").text()).toBe(tr("NO_SELECTED_FEATURES"));
    });
    it("Selection should show first feature of first layer when set", () => {
        const onZoomRequest = jest.fn();
        const set: SelectedFeatureSet = createSelectionSet();
        const wrapper = mount(<SelectionPanel selection={set} onRequestZoomToFeature={onZoomRequest} />);
        expect(wrapper.find(".selection-panel-toolbar")).toHaveLength(1);
        expect(wrapper.find(".selection-panel-property-grid")).toHaveLength(1);
        expect(wrapper.state("selectedLayerIndex")).toBe(0);
        expect(wrapper.state("featureIndex")).toBe(0);
        expect(wrapper.find("tr")).toHaveLength(3);
    });
    it("Can scroll forwards/backwards on first selected layer", () => {
        const onZoomRequest = jest.fn();
        const set: SelectedFeatureSet = createSelectionSet();
        const wrapper = mount(<SelectionPanel selection={set} onRequestZoomToFeature={onZoomRequest} />);
        expect(wrapper.find(".selection-panel-toolbar")).toHaveLength(1);
        expect(wrapper.find(".toolbar-btn")).toHaveLength(3);
        const back = wrapper.find(".toolbar-btn").at(0);
        const fwd = wrapper.find(".toolbar-btn").at(1);
        fwd.simulate("click");
        expect(wrapper.state("featureIndex")).toBe(1);
        back.simulate("click");
        expect(wrapper.state("featureIndex")).toBe(0);
    });
    it("Zoom to current feature raises handler", () => {
        const onZoomRequest = jest.fn();
        const set: SelectedFeatureSet = createSelectionSet();
        const wrapper = mount(<SelectionPanel selection={set} onRequestZoomToFeature={onZoomRequest} />);
        expect(wrapper.find(".selection-panel-toolbar")).toHaveLength(1);
        expect(wrapper.find(".toolbar-btn")).toHaveLength(3);
        const zoom = wrapper.find(".toolbar-btn").at(2);
        zoom.simulate("click");
        expect(onZoomRequest.mock.calls).toHaveLength(1);
        expect(onZoomRequest.mock.calls[0]).toHaveLength(1);
        expect(onZoomRequest.mock.calls[0][0]).toBe(set.SelectedLayer[0].Feature[0]);
    });
    it("Switching selected layer resets feature index to 0", () => {
        const onZoomRequest = jest.fn();
        const set: SelectedFeatureSet = createSelectionSet();
        const wrapper = mount(<SelectionPanel selection={set} onRequestZoomToFeature={onZoomRequest} />);
        expect(wrapper.find(".selection-panel-toolbar")).toHaveLength(1); //, "Has Toolbar");
        expect(wrapper.find(".toolbar-btn")).toHaveLength(3); //, "Has Toolbar Buttons");
        const fwd = wrapper.find(".toolbar-btn").at(1);
        const select = wrapper.find("select");
        expect(select).toHaveLength(1); //, "Has Layer Select");
        expect(select.find("option")).toHaveLength(2);
        fwd.simulate("click");
        expect(wrapper.state("featureIndex")).toBe(1);
        select.simulate('change', { target: { value : 1 } });
        expect(wrapper.state("selectedLayerIndex")).toBe(1);
        expect(wrapper.state("featureIndex")).toBe(0);
    });
});